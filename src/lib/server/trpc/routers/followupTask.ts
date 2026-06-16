import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { followupTasks, exceptionOrders } from '../../db/schema';
import { eq, desc, and, count, gte, lte } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const followupTaskRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        patientId: z.string().optional(),
        status: z.enum(['pending', 'completed', 'missed', 'cancelled']).optional(),
        type: z.enum(['phone', 'visit', 'imaging', 'consultation']).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional()
      })
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;
      const whereConditions = [];

      if (input.patientId) {
        whereConditions.push(eq(followupTasks.patientId, input.patientId));
      }
      if (input.status) {
        whereConditions.push(eq(followupTasks.status, input.status));
      }
      if (input.type) {
        whereConditions.push(eq(followupTasks.type, input.type));
      }
      if (input.startDate) {
        whereConditions.push(gte(followupTasks.scheduledDate, new Date(input.startDate)));
      }
      if (input.endDate) {
        whereConditions.push(lte(followupTasks.scheduledDate, new Date(input.endDate)));
      }

      const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(followupTasks)
        .where(where);

      const items = await ctx.db
        .select()
        .from(followupTasks)
        .where(where)
        .orderBy(desc(followupTasks.scheduledDate))
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
      const [task] = await ctx.db
        .select()
        .from(followupTasks)
        .where(eq(followupTasks.id, input.id));
      if (!task) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '随访任务不存在' });
      }
      return task;
    }),

  create: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        treatmentPlanId: z.string().optional(),
        type: z.enum(['phone', 'visit', 'imaging', 'consultation']),
        scheduledDate: z.string(),
        notes: z.string().optional(),
        assigneeId: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newTask] = await ctx.db
        .insert(followupTasks)
        .values({
          ...input,
          scheduledDate: new Date(input.scheduledDate),
          createdBy: ctx.user.id
        })
        .returning();
      return newTask;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        type: z.enum(['phone', 'visit', 'imaging', 'consultation']).optional(),
        scheduledDate: z.string().optional(),
        notes: z.string().optional(),
        assigneeId: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updateData: any = { ...data, updatedAt: new Date() };
      if (data.scheduledDate) {
        updateData.scheduledDate = new Date(data.scheduledDate);
      }
      const [updated] = await ctx.db
        .update(followupTasks)
        .set(updateData)
        .where(eq(followupTasks.id, id))
        .returning();
      return updated;
    }),

  markCompleted: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        result: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(followupTasks)
        .set({
          status: 'completed',
          actualDate: new Date(),
          result: input.result,
          updatedAt: new Date()
        })
        .where(eq(followupTasks.id, input.id))
        .returning();
      return updated;
    }),

  markMissed: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        createException: z.boolean().default(false),
        exceptionDescription: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [task] = await ctx.db
        .select()
        .from(followupTasks)
        .where(eq(followupTasks.id, input.id));

      if (!task) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '随访任务不存在' });
      }

      const [updated] = await ctx.db
        .update(followupTasks)
        .set({
          status: 'missed',
          updatedAt: new Date()
        })
        .where(eq(followupTasks.id, input.id))
        .returning();

      if (input.createException) {
        await ctx.db.insert(exceptionOrders).values({
          patientId: task.patientId,
          followupTaskId: task.id,
          title: `患者爽约 - ${task.type}`,
          description: input.exceptionDescription || '患者未按时完成随访',
          severity: 'medium',
          status: 'open',
          impactScope: '影响治疗计划进度，需重新安排随访时间',
          responsibility: 'patient',
          reportedBy: ctx.user.id
        });
      }

      return updated;
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(followupTasks)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(followupTasks.id, input.id))
        .returning();
      return updated;
    })
});
