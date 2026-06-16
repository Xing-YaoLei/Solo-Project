import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, managerProcedure } from '../context';
import { followupRecords, communicationNotes, members, prescriptions, drugBatches, drugs, replenishmentOrders } from '../../db/schema';
import { eq, and, desc, asc, count, gte, lte } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';

export const followupRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
      riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      assignedOnly: z.boolean().default(false),
      page: z.number().default(1),
      pageSize: z.number().default(20)
    }))
    .query(async ({ ctx, input }) => {
      const whereConditions = [];
      
      if (input.status) {
        whereConditions.push(eq(followupRecords.status, input.status));
      }
      
      if (input.riskLevel) {
        whereConditions.push(eq(followupRecords.riskLevel, input.riskLevel));
      }
      
      if (input.assignedOnly || !['admin', 'manager'].includes(ctx.user.role)) {
        whereConditions.push(eq(followupRecords.assignedTo, ctx.user.id));
      }

      const offset = (input.page - 1) * input.pageSize;

      const [records, total] = await Promise.all([
        ctx.db.query.followupRecords.findMany({
          where: and(...whereConditions),
          with: {
            member: true,
            assignedUser: {
              columns: {
                id: true,
                name: true
              }
            },
            prescription: true
          },
          orderBy: [desc(followupRecords.createdAt)],
          limit: input.pageSize,
          offset
        }),
        ctx.db.select({ count: count() }).from(followupRecords).where(and(...whereConditions))
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
      const record = await ctx.db.query.followupRecords.findFirst({
        where: eq(followupRecords.id, input),
        with: {
          member: true,
          prescription: {
            with: {
              items: true
            }
          },
          replenishmentOrder: {
            with: {
              items: {
                with: {
                  drug: true,
                  batch: true
                }
              }
            }
          },
          insuranceRecord: true,
          assignedUser: {
            columns: {
              id: true,
              name: true,
              role: true
            }
          },
          notes: {
            with: {
              createdBy: {
                columns: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            },
            orderBy: [desc(communicationNotes.createdAt)]
          }
        }
      });

      if (!record) {
        throw new Error('回访记录不存在');
      }

      if (!['admin', 'manager'].includes(ctx.user.role) && record.assignedTo !== ctx.user.id) {
        throw new Error('无权限查看此记录');
      }

      return record;
    }),

  create: protectedProcedure
    .input(z.object({
      memberId: z.string(),
      prescriptionId: z.string().optional(),
      replenishmentOrderId: z.string().optional(),
      riskLevel: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
      nextFollowupDate: z.date().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const id = generateIdFromEntropySize(21);
      
      const [record] = await ctx.db.insert(followupRecords).values({
        id,
        memberId: input.memberId,
        prescriptionId: input.prescriptionId,
        replenishmentOrderId: input.replenishmentOrderId,
        riskLevel: input.riskLevel,
        status: 'pending',
        assignedTo: ctx.user.id,
        pharmacyId: ctx.user.pharmacyId,
        nextFollowupDate: input.nextFollowupDate,
        createdBy: ctx.user.id
      }).returning();

      return record;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
      riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      followupDate: z.date().optional(),
      nextFollowupDate: z.date().optional(),
      medicationAdherence: z.boolean().optional(),
      adverseReaction: z.boolean().optional(),
      symptomImprovement: z.string().optional(),
      reviewOpinion: z.string().optional(),
      assignedTo: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.db.query.followupRecords.findFirst({
        where: eq(followupRecords.id, input.id)
      });

      if (!record) {
        throw new Error('回访记录不存在');
      }

      if (!['admin', 'manager'].includes(ctx.user.role) && record.assignedTo !== ctx.user.id) {
        throw new Error('无权限修改此记录');
      }

      const updateData: Record<string, unknown> = {};
      
      if (input.status !== undefined) updateData.status = input.status;
      if (input.riskLevel !== undefined) updateData.riskLevel = input.riskLevel;
      if (input.followupDate !== undefined) updateData.followupDate = input.followupDate;
      if (input.nextFollowupDate !== undefined) updateData.nextFollowupDate = input.nextFollowupDate;
      if (input.medicationAdherence !== undefined) updateData.medicationAdherence = input.medicationAdherence;
      if (input.adverseReaction !== undefined) updateData.adverseReaction = input.adverseReaction;
      if (input.symptomImprovement !== undefined) updateData.symptomImprovement = input.symptomImprovement;
      if (input.reviewOpinion !== undefined) updateData.reviewOpinion = input.reviewOpinion;
      if (input.assignedTo !== undefined) updateData.assignedTo = input.assignedTo;
      
      updateData.updatedAt = new Date();

      const [updated] = await ctx.db.update(followupRecords)
        .set(updateData)
        .where(eq(followupRecords.id, input.id))
        .returning();

      return updated;
    }),

  addNote: protectedProcedure
    .input(z.object({
      followupRecordId: z.string(),
      content: z.string(),
      isReview: z.boolean().default(false)
    }))
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.db.query.followupRecords.findFirst({
        where: eq(followupRecords.id, input.followupRecordId)
      });

      if (!record) {
        throw new Error('回访记录不存在');
      }

      if (!['admin', 'manager'].includes(ctx.user.role) && record.assignedTo !== ctx.user.id) {
        throw new Error('无权限添加备注');
      }

      if (input.isReview && !['admin', 'manager'].includes(ctx.user.role)) {
        throw new Error('只有管理层可以添加复核意见');
      }

      const id = generateIdFromEntropySize(21);
      
      const [note] = await ctx.db.insert(communicationNotes).values({
        id,
        followupRecordId: input.followupRecordId,
        content: input.content,
        isReview: input.isReview,
        createdBy: ctx.user.id
      }).returning();

      await ctx.db.update(followupRecords)
        .set({ updatedAt: new Date() })
        .where(eq(followupRecords.id, input.followupRecordId));

      return note;
    }),

  getDashboardStats: managerProcedure
    .query(async ({ ctx }) => {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalCount,
        pendingCount,
        inProgressCount,
        completedCount,
        highRiskCount
      ] = await Promise.all([
        ctx.db.select({ count: count() }).from(followupRecords),
        ctx.db.select({ count: count() }).from(followupRecords).where(eq(followupRecords.status, 'pending')),
        ctx.db.select({ count: count() }).from(followupRecords).where(eq(followupRecords.status, 'in_progress')),
        ctx.db.select({ count: count() }).from(followupRecords).where(eq(followupRecords.status, 'completed')),
        ctx.db.select({ count: count() }).from(followupRecords).where(eq(followupRecords.riskLevel, 'high'))
      ]);

      return {
        total: totalCount[0]?.count || 0,
        pending: pendingCount[0]?.count || 0,
        inProgress: inProgressCount[0]?.count || 0,
        completed: completedCount[0]?.count || 0,
        highRisk: highRiskCount[0]?.count || 0
      };
    }),

  getCompletionTrend: managerProcedure
    .input(z.object({
      days: z.number().default(30)
    }))
    .query(async ({ ctx, input }) => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - input.days * 24 * 60 * 60 * 1000);

      const allRecords = await ctx.db.query.followupRecords.findMany({
        where: and(
          gte(followupRecords.createdAt, startDate),
          lte(followupRecords.createdAt, endDate)
        ),
        columns: {
          createdAt: true,
          status: true
        }
      });

      const dailyData: Array<{
        date: string;
        total: number;
        completed: number;
        completionRate: number;
      }> = [];

      for (let i = input.days - 1; i >= 0; i--) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayRecords = allRecords.filter(r => 
          r.createdAt.toISOString().split('T')[0] === dateStr
        );
        
        const total = dayRecords.length;
        const completed = dayRecords.filter(r => r.status === 'completed').length;
        
        dailyData.push({
          date: dateStr,
          total,
          completed,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        });
      }

      return dailyData;
    }),

  getMyTodos: protectedProcedure
    .query(async ({ ctx }) => {
      const records = await ctx.db.query.followupRecords.findMany({
        where: and(
          eq(followupRecords.assignedTo, ctx.user.id),
          eq(followupRecords.status, 'pending')
        ),
        with: {
          member: true
        },
        orderBy: [asc(followupRecords.nextFollowupDate), desc(followupRecords.riskLevel)],
        limit: 10
      });

      return records;
    })
});
