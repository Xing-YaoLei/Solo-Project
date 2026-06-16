import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../context';
import { prescriptions, prescriptionItems, insuranceRecords } from '../../db/schema';
import { eq, and, desc, count, like } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';

export const prescriptionRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      memberId: z.string().optional(),
      status: z.enum(['clear', 'unclear', 'verified', 'rejected']).optional(),
      riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20)
    }))
    .query(async ({ ctx, input }) => {
      if (!['admin', 'manager'].includes(ctx.user.role)) {
        throw new Error('无权限访问处方管理');
      }

      const whereConditions = [];
      
      if (input.memberId) {
        whereConditions.push(eq(prescriptions.memberId, input.memberId));
      }
      
      if (input.status) {
        whereConditions.push(eq(prescriptions.status, input.status));
      }
      
      if (input.riskLevel) {
        whereConditions.push(eq(prescriptions.riskLevel, input.riskLevel));
      }

      const offset = (input.page - 1) * input.pageSize;

      const [records, total] = await Promise.all([
        ctx.db.query.prescriptions.findMany({
          where: and(...whereConditions),
          with: {
            member: {
              columns: {
                id: true,
                name: true,
                memberNo: true
              }
            }
          },
          orderBy: [desc(prescriptions.createdAt)],
          limit: input.pageSize,
          offset
        }),
        ctx.db.select({ count: count() }).from(prescriptions).where(and(...whereConditions))
      ]);

      return {
        records,
        total: total[0]?.count || 0,
        page: input.page,
        pageSize: input.pageSize
      };
    }),

  get: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      if (!['admin', 'manager'].includes(ctx.user.role)) {
        throw new Error('无权限访问处方管理');
      }

      const prescription = await ctx.db.query.prescriptions.findFirst({
        where: eq(prescriptions.id, input),
        with: {
          member: true,
          items: true
        }
      });

      if (!prescription) {
        throw new Error('处方不存在');
      }

      return prescription;
    }),

  create: protectedProcedure
    .input(z.object({
      memberId: z.string(),
      prescriptionNo: z.string().optional(),
      hospital: z.string().optional(),
      doctor: z.string().optional(),
      issueDate: z.date().optional(),
      status: z.enum(['clear', 'unclear', 'verified', 'rejected']).default('clear'),
      riskLevel: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
      photoUrl: z.string().optional(),
      notes: z.string().optional(),
      items: z.array(z.object({
        drugId: z.string().optional(),
        drugName: z.string(),
        specification: z.string().optional(),
        dosage: z.string().optional(),
        frequency: z.string().optional(),
        duration: z.string().optional(),
        quantity: z.number().optional()
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      if (!['admin', 'manager'].includes(ctx.user.role)) {
        throw new Error('无权限创建处方');
      }

      const id = generateIdFromEntropySize(21);
      const { items, ...prescriptionData } = input;

      await ctx.db.transaction(async (tx) => {
        await tx.insert(prescriptions).values({
          id,
          ...prescriptionData
        });

        for (const item of items) {
          const itemId = generateIdFromEntropySize(21);
          await tx.insert(prescriptionItems).values({
            id: itemId,
            prescriptionId: id,
            ...item
          });
        }
      });

      const prescription = await ctx.db.query.prescriptions.findFirst({
        where: eq(prescriptions.id, id)
      });

      return prescription;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['clear', 'unclear', 'verified', 'rejected']).optional(),
      riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!['admin', 'manager'].includes(ctx.user.role)) {
        throw new Error('无权限修改处方');
      }

      const { id, ...updateData } = input;
      
      const [prescription] = await ctx.db.update(prescriptions)
        .set(updateData)
        .where(eq(prescriptions.id, id))
        .returning();

      return prescription;
    })
});

export const insuranceRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      memberId: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20)
    }))
    .query(async ({ ctx, input }) => {
      if (!['admin', 'manager'].includes(ctx.user.role)) {
        throw new Error('无权限访问医保流水');
      }

      const whereConditions = [];
      
      if (input.memberId) {
        whereConditions.push(eq(insuranceRecords.memberId, input.memberId));
      }

      const offset = (input.page - 1) * input.pageSize;

      const [records, total] = await Promise.all([
        ctx.db.query.insuranceRecords.findMany({
          where: and(...whereConditions),
          with: {
            member: {
              columns: {
                id: true,
                name: true,
                memberNo: true
              }
            }
          },
          orderBy: [desc(insuranceRecords.transactionDate)],
          limit: input.pageSize,
          offset
        }),
        ctx.db.select({ count: count() }).from(insuranceRecords).where(and(...whereConditions))
      ]);

      return {
        records,
        total: total[0]?.count || 0,
        page: input.page,
        pageSize: input.pageSize
      };
    }),

  get: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      if (!['admin', 'manager'].includes(ctx.user.role)) {
        throw new Error('无权限访问医保流水');
      }

      const record = await ctx.db.query.insuranceRecords.findFirst({
        where: eq(insuranceRecords.id, input),
        with: {
          member: true,
          prescription: true
        }
      });

      if (!record) {
        throw new Error('医保记录不存在');
      }

      return record;
    }),

  create: protectedProcedure
    .input(z.object({
      recordNo: z.string(),
      memberId: z.string(),
      prescriptionId: z.string().optional(),
      transactionDate: z.date(),
      totalAmount: z.number(),
      insuranceAmount: z.number(),
      selfPayAmount: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!['admin', 'manager'].includes(ctx.user.role)) {
        throw new Error('无权限创建医保流水');
      }

      const id = generateIdFromEntropySize(21);
      
      const [record] = await ctx.db.insert(insuranceRecords).values({
        id,
        ...input,
        pharmacyId: ctx.user.pharmacyId
      }).returning();

      return record;
    })
});
