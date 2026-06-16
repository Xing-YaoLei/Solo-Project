import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { medicalRecords, recordStatusHistory } from '../../db/schema';
import { eq, desc, and, count } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import type { RecordStatus } from '$lib/types';

export const medicalRecordRouter = createTRPCRouter({
  listByPatient: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        page: z.number().default(1),
        pageSize: z.number().default(20)
      })
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(medicalRecords)
        .where(eq(medicalRecords.patientId, input.patientId));

      const items = await ctx.db
        .select()
        .from(medicalRecords)
        .where(eq(medicalRecords.patientId, input.patientId))
        .orderBy(desc(medicalRecords.visitDate))
        .limit(input.pageSize)
        .offset(offset);

      return {
        items,
        total: totalResult.count,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(totalResult.count / input.pageSize)
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [record] = await ctx.db
        .select()
        .from(medicalRecords)
        .where(eq(medicalRecords.id, input.id));
      if (!record) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '病历不存在' });
      }
      return record;
    }),

  create: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        visitDate: z.string(),
        chiefComplaint: z.string().optional(),
        diagnosis: z.string().optional(),
        treatmentSummary: z.string().optional(),
        status: z.enum(['draft', 'reviewing', 'confirmed', 'archived']).default('draft'),
        doctorId: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newRecord] = await ctx.db
        .insert(medicalRecords)
        .values({
          ...input,
          createdBy: ctx.user.id
        })
        .returning();

      await ctx.db.insert(recordStatusHistory).values({
        recordId: newRecord.id,
        toStatus: input.status,
        changedBy: ctx.user.id,
        remark: '创建病历'
      });

      return newRecord;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        visitDate: z.string().optional(),
        chiefComplaint: z.string().optional(),
        diagnosis: z.string().optional(),
        treatmentSummary: z.string().optional(),
        doctorId: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(medicalRecords)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(medicalRecords.id, id))
        .returning();
      return updated;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['draft', 'reviewing', 'confirmed', 'archived']),
        remark: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [oldRecord] = await ctx.db
        .select()
        .from(medicalRecords)
        .where(eq(medicalRecords.id, input.id));

      if (!oldRecord) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '病历不存在' });
      }

      const [updated] = await ctx.db
        .update(medicalRecords)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(medicalRecords.id, input.id))
        .returning();

      await ctx.db.insert(recordStatusHistory).values({
        recordId: input.id,
        fromStatus: oldRecord.status,
        toStatus: input.status,
        changedBy: ctx.user.id,
        remark: input.remark
      });

      return updated;
    }),

  getStatusHistory: protectedProcedure
    .input(z.object({ recordId: z.string() }))
    .query(async ({ ctx, input }) => {
      const history = await ctx.db
        .select()
        .from(recordStatusHistory)
        .where(eq(recordStatusHistory.recordId, input.recordId))
        .orderBy(desc(recordStatusHistory.changedAt));
      return history;
    })
});
