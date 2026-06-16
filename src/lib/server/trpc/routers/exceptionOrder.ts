import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { exceptionOrders } from '../../db/schema';
import { eq, desc, and, count } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const exceptionOrderRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        patientId: z.string().optional(),
        status: z.enum(['open', 'investigating', 'resolved', 'closed']).optional(),
        severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        responsibility: z
          .enum(['patient', 'clinic', 'doctor', 'system', 'other'])
          .optional()
      })
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;
      const whereConditions = [];

      if (input.patientId) {
        whereConditions.push(eq(exceptionOrders.patientId, input.patientId));
      }
      if (input.status) {
        whereConditions.push(eq(exceptionOrders.status, input.status));
      }
      if (input.severity) {
        whereConditions.push(eq(exceptionOrders.severity, input.severity));
      }
      if (input.responsibility) {
        whereConditions.push(eq(exceptionOrders.responsibility, input.responsibility));
      }

      const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(exceptionOrders)
        .where(where);

      const items = await ctx.db
        .select()
        .from(exceptionOrders)
        .where(where)
        .orderBy(desc(exceptionOrders.createdAt))
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
      const [order] = await ctx.db
        .select()
        .from(exceptionOrders)
        .where(eq(exceptionOrders.id, input.id));
      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '异常单不存在' });
      }
      return order;
    }),

  create: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        followupTaskId: z.string().optional(),
        title: z.string(),
        description: z.string().optional(),
        severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        impactScope: z.string().optional(),
        responsibility: z.enum(['patient', 'clinic', 'doctor', 'system', 'other']).optional(),
        responsiblePerson: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newOrder] = await ctx.db
        .insert(exceptionOrders)
        .values({
          ...input,
          reportedBy: ctx.user.id
        })
        .returning();
      return newOrder;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        status: z.enum(['open', 'investigating', 'resolved', 'closed']).optional(),
        impactScope: z.string().optional(),
        responsibility: z.enum(['patient', 'clinic', 'doctor', 'system', 'other']).optional(),
        responsiblePerson: z.string().optional(),
        handlingResult: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updateData: any = { ...data, updatedAt: new Date() };
      if (data.status === 'closed') {
        updateData.closedAt = new Date();
      }
      const [updated] = await ctx.db
        .update(exceptionOrders)
        .set(updateData)
        .where(eq(exceptionOrders.id, id))
        .returning();
      return updated;
    }),

  resolve: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        handlingResult: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(exceptionOrders)
        .set({
          status: 'resolved',
          handlingResult: input.handlingResult,
          handledBy: ctx.user.id,
          updatedAt: new Date()
        })
        .where(eq(exceptionOrders.id, input.id))
        .returning();
      return updated;
    }),

  close: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(exceptionOrders)
        .set({
          status: 'closed',
          closedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(exceptionOrders.id, input.id))
        .returning();
      return updated;
    })
});
