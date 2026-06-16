import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { treatmentPlans } from '../../db/schema';
import { eq, desc, and, count } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const treatmentPlanRouter = createTRPCRouter({
  listByPatient: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
        status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).optional()
      })
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;
      const whereConditions = [eq(treatmentPlans.patientId, input.patientId)];

      if (input.status) {
        whereConditions.push(eq(treatmentPlans.status, input.status));
      }

      const where = and(...whereConditions);

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(treatmentPlans)
        .where(where);

      const items = await ctx.db
        .select()
        .from(treatmentPlans)
        .where(where)
        .orderBy(desc(treatmentPlans.createdAt))
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
      const [plan] = await ctx.db
        .select()
        .from(treatmentPlans)
        .where(eq(treatmentPlans.id, input.id));
      if (!plan) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '治疗计划不存在' });
      }
      return plan;
    }),

  create: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        recordId: z.string().optional(),
        title: z.string(),
        description: z.string().optional(),
        estimatedCost: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        doctorId: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newPlan] = await ctx.db
        .insert(treatmentPlans)
        .values({
          ...input,
          createdBy: ctx.user.id
        })
        .returning();
      return newPlan;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).optional(),
        estimatedCost: z.number().optional(),
        actualCost: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        doctorId: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(treatmentPlans)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(treatmentPlans.id, id))
        .returning();
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(treatmentPlans).where(eq(treatmentPlans.id, input.id));
      return { success: true };
    })
});
