import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../context';
import { replenishmentOrders, replenishmentOrderItems } from '../../db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';

export const replenishmentRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      memberId: z.string().optional(),
      status: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20)
    }))
    .query(async ({ ctx, input }) => {
      const whereConditions = [];
      
      if (input.memberId) {
        whereConditions.push(eq(replenishmentOrders.memberId, input.memberId));
      }
      
      if (input.status) {
        whereConditions.push(eq(replenishmentOrders.status, input.status));
      }

      const offset = (input.page - 1) * input.pageSize;

      const [records, total] = await Promise.all([
        ctx.db.query.replenishmentOrders.findMany({
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
          orderBy: [desc(replenishmentOrders.createdAt)],
          limit: input.pageSize,
          offset
        }),
        ctx.db.select({ count: count() }).from(replenishmentOrders).where(and(...whereConditions))
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
      const order = await ctx.db.query.replenishmentOrders.findFirst({
        where: eq(replenishmentOrders.id, input),
        with: {
          member: true,
          items: {
            with: {
              drug: true,
              batch: true
            }
          }
        }
      });

      if (!order) {
        throw new Error('补货单不存在');
      }

      return order;
    }),

  create: protectedProcedure
    .input(z.object({
      memberId: z.string(),
      items: z.array(z.object({
        drugId: z.string(),
        batchId: z.string().optional(),
        quantity: z.number(),
        unitPrice: z.number(),
        subtotal: z.number()
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      const orderId = generateIdFromEntropySize(21);
      const orderNo = 'RB' + Date.now();
      
      const totalAmount = input.items.reduce((sum, item) => sum + item.subtotal, 0);

      await ctx.db.transaction(async (tx) => {
        await tx.insert(replenishmentOrders).values({
          id: orderId,
          orderNo,
          memberId: input.memberId,
          pharmacyId: ctx.user.pharmacyId,
          status: 'pending',
          totalAmount,
          createdBy: ctx.user.id
        });

        for (const item of input.items) {
          const itemId = generateIdFromEntropySize(21);
          await tx.insert(replenishmentOrderItems).values({
            id: itemId,
            orderId,
            ...item
          });
        }
      });

      const order = await ctx.db.query.replenishmentOrders.findFirst({
        where: eq(replenishmentOrders.id, orderId)
      });

      return order;
    })
});
