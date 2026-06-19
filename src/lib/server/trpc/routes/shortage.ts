import { z } from 'zod';
import { router, protectedProcedure, managerProcedure, frontlineProcedure } from '../t';
import { db } from '$db';
import { shortageOrders, shortageHistory, users, workOrders } from '$db/schema';
import { eq, and, inArray, gte, lte, desc, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

const shortageStatusEnum = z.enum(['pending', 'processing', 'replenished', 'retried', 'closed']);
const shortageActionEnum = z.enum(['report', 'assign', 'replenish', 'retry', 'close']);

const statusTransitions: Record<string, string[]> = {
  pending: ['processing', 'closed'],
  processing: ['replenished', 'retried', 'closed'],
  replenished: ['closed'],
  retried: ['processing', 'closed'],
  closed: []
};

export const shortageRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.array(shortageStatusEnum).optional(),
        assigneeId: z.string().optional(),
        region: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0)
      })
    )
    .query(async ({ input, ctx }) => {
      const where = [];
      
      if (input.status && input.status.length > 0) {
        where.push(inArray(shortageOrders.status, input.status));
      }
      if (input.assigneeId) where.push(eq(shortageOrders.assigneeId, input.assigneeId));
      if (input.region) where.push(eq(shortageOrders.region, input.region));
      if (input.dateFrom) where.push(gte(shortageOrders.createdAt, input.dateFrom));
      if (input.dateTo) where.push(lte(shortageOrders.createdAt, input.dateTo));

      const orders = await db
        .select()
        .from(shortageOrders)
        .where(and(...where))
        .orderBy(desc(shortageOrders.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          const [assignee] = await db.select().from(users).where(eq(users.id, order.assigneeId)).limit(1);
          const [reporter] = await db.select().from(users).where(eq(users.id, order.reporterId)).limit(1);
          const history = await db
            .select()
            .from(shortageHistory)
            .where(eq(shortageHistory.shortageOrderId, order.id))
            .orderBy(desc(shortageHistory.createdAt));

          const historyWithOperators = await Promise.all(
            history.map(async (h) => {
              const [operator] = await db.select().from(users).where(eq(users.id, h.operatorId)).limit(1);
              return { ...h, operatorName: operator?.name || '未知' };
            })
          );

          return { ...order, assignee, reporter, history: historyWithOperators };
        })
      );

      return ordersWithDetails;
    }),

  get: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const [order] = await db.select().from(shortageOrders).where(eq(shortageOrders.id, input)).limit(1);
      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '缺货单不存在' });
      }

      const [assignee] = await db.select().from(users).where(eq(users.id, order.assigneeId)).limit(1);
      const [reporter] = await db.select().from(users).where(eq(users.id, order.reporterId)).limit(1);
      const [workOrder] = await db.select().from(workOrders).where(eq(workOrders.id, order.workOrderId)).limit(1);
      
      const history = await db
        .select()
        .from(shortageHistory)
        .where(eq(shortageHistory.shortageOrderId, input))
        .orderBy(shortageHistory.createdAt);

      const historyWithOperators = await Promise.all(
        history.map(async (h) => {
          const [operator] = await db.select().from(users).where(eq(users.id, h.operatorId)).limit(1);
          return { ...h, operatorName: operator?.name || '未知' };
        })
      );

      return { ...order, assignee, reporter, workOrder, history: historyWithOperators };
    }),

  create: frontlineProcedure
    .input(
      z.object({
        workOrderId: z.string(),
        partNumber: z.string().min(1),
        partName: z.string().min(1),
        quantity: z.number().int().min(1),
        assigneeId: z.string().min(1)
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.transaction(async (tx) => {
        const [newOrder] = await tx
          .insert(shortageOrders)
          .values({
            workOrderId: input.workOrderId,
            partNumber: input.partNumber,
            partName: input.partName,
            quantity: input.quantity,
            status: 'pending',
            assigneeId: input.assigneeId,
            reporterId: ctx.user.id,
            region: ctx.user.region || undefined
          })
          .returning();

        await tx.insert(shortageHistory).values({
          shortageOrderId: newOrder.id,
          operatorId: ctx.user.id,
          action: 'report',
          remark: `上报缺货: ${input.partName} x ${input.quantity}`
        });

        return newOrder;
      });
    }),

  process: managerProcedure
    .input(
      z.object({
        id: z.string(),
        action: shortageActionEnum,
        remark: z.string().optional()
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.transaction(async (tx) => {
        const [order] = await tx.select().from(shortageOrders).where(eq(shortageOrders.id, input.id)).limit(1);
        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '缺货单不存在' });
        }

        const actionToStatus: Record<string, string> = {
          report: 'pending',
          assign: 'processing',
          replenish: 'replenished',
          retry: 'retried',
          close: 'closed'
        };

        const newStatus = actionToStatus[input.action];
        if (!newStatus) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '无效操作' });
        }

        const allowedTransitions = statusTransitions[order.status] || [];
        if (!allowedTransitions.includes(newStatus) && input.action !== 'assign') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `无法从 ${order.status} 状态执行 ${input.action} 操作`
          });
        }

        const [updatedOrder] = await tx
          .update(shortageOrders)
          .set({
            status: newStatus as any,
            updatedAt: new Date()
          })
          .where(eq(shortageOrders.id, input.id))
          .returning();

        await tx.insert(shortageHistory).values({
          shortageOrderId: input.id,
          operatorId: ctx.user.id,
          action: input.action,
          remark: input.remark || getDefaultRemark(input.action, order.partName)
        });

        return updatedOrder;
      });
    }),

  assign: managerProcedure
    .input(
      z.object({
        id: z.string(),
        assigneeId: z.string(),
        remark: z.string().optional()
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.transaction(async (tx) => {
        const [order] = await tx.select().from(shortageOrders).where(eq(shortageOrders.id, input.id)).limit(1);
        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '缺货单不存在' });
        }

        const [updatedOrder] = await tx
          .update(shortageOrders)
          .set({
            assigneeId: input.assigneeId,
            status: 'processing',
            updatedAt: new Date()
          })
          .where(eq(shortageOrders.id, input.id))
          .returning();

        const [newAssignee] = await tx.select().from(users).where(eq(users.id, input.assigneeId)).limit(1);

        await tx.insert(shortageHistory).values({
          shortageOrderId: input.id,
          operatorId: ctx.user.id,
          action: 'assign',
          remark: input.remark || `分配给 ${newAssignee?.name || '未知用户'}`
        });

        return updatedOrder;
      });
    }),

  getStats: protectedProcedure.query(async () => {
    const stats = await db
      .select({
        status: shortageOrders.status,
        count: sql<number>`count(*)`.as('count')
      })
      .from(shortageOrders)
      .groupBy(shortageOrders.status);

    return {
      pending: stats.find((s) => s.status === 'pending')?.count || 0,
      processing: stats.find((s) => s.status === 'processing')?.count || 0,
      replenished: stats.find((s) => s.status === 'replenished')?.count || 0,
      retried: stats.find((s) => s.status === 'retried')?.count || 0,
      closed: stats.find((s) => s.status === 'closed')?.count || 0,
      total: stats.reduce((sum, s) => sum + s.count, 0)
    };
  })
});

function getDefaultRemark(action: string, partName: string): string {
  const remarks: Record<string, string> = {
    replenish: `已补录配件: ${partName}`,
    retry: `已重试处理: ${partName}`,
    close: `已关闭缺货单: ${partName}`
  };
  return remarks[action] || action;
}
