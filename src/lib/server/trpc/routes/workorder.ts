import { z } from 'zod';
import { router, protectedProcedure, frontlineProcedure, adminProcedure } from '../t';
import { db } from '$db';
import { workOrders, workOrderItems, vehicles, quoteItems, quoteParts } from '$db/schema';
import { eq, and, ilike, desc, inArray, gte, lte, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

const workOrderStatusEnum = z.enum(['pending', 'diagnosed', 'quoted', 'in_progress', 'completed', 'cancelled']);

const workOrderItemInput = z.object({
  quoteItemId: z.string(),
  quantity: z.number().int().min(1)
});

export const workOrderRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: workOrderStatusEnum.optional(),
        region: z.string().optional(),
        createdBy: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        isRework: z.boolean().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0)
      })
    )
    .query(async ({ input }) => {
      const where = [];
      if (input.status) where.push(eq(workOrders.status, input.status));
      if (input.region) where.push(eq(workOrders.region, input.region));
      if (input.createdBy) where.push(eq(workOrders.createdBy, input.createdBy));
      if (input.dateFrom) where.push(gte(workOrders.createdAt, input.dateFrom));
      if (input.dateTo) where.push(lte(workOrders.createdAt, input.dateTo));
      if (input.isRework !== undefined) where.push(eq(workOrders.isRework, input.isRework));

      const orders = await db
        .select()
        .from(workOrders)
        .where(and(...where))
        .orderBy(desc(workOrders.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, order.vehicleId)).limit(1);
          const items = await db.select().from(workOrderItems).where(eq(workOrderItems.workOrderId, order.id));
          return { ...order, vehicle, items };
        })
      );

      return ordersWithDetails;
    }),

  get: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const [order] = await db.select().from(workOrders).where(eq(workOrders.id, input)).limit(1);
      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '工单不存在' });
      }

      const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, order.vehicleId)).limit(1);
      const items = await db.select().from(workOrderItems).where(eq(workOrderItems.workOrderId, input));

      const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
          const [quoteItem] = await db.select().from(quoteItems).where(eq(quoteItems.id, item.quoteItemId)).limit(1);
          return { ...item, quoteItem };
        })
      );

      return { ...order, vehicle, items: itemsWithDetails };
    }),

  create: frontlineProcedure
    .input(
      z.object({
        vehicleId: z.string(),
        diagnosisResult: z.string().optional(),
        items: z.array(workOrderItemInput),
        status: workOrderStatusEnum.default('quoted')
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.transaction(async (tx) => {
        let totalAmount = 0;
        const processedItems = [];

        for (const item of input.items) {
          const [quoteItem] = await tx.select().from(quoteItems).where(eq(quoteItems.id, item.quoteItemId)).limit(1);
          if (!quoteItem) {
            throw new TRPCError({ code: 'NOT_FOUND', message: `报价项目 ${item.quoteItemId} 不存在` });
          }

          const parts = await tx.select().from(quoteParts).where(eq(quoteParts.quoteItemId, item.quoteItemId));
          const partsTotal = parts.reduce((sum, p) => sum + parseFloat(String(p.unitPrice)) * p.quantity, 0);
          const laborTotal = parseFloat(String(quoteItem.laborPrice)) * item.quantity;
          const subtotal = (partsTotal + laborTotal) * item.quantity;
          totalAmount += subtotal;

          processedItems.push({
            quoteItemId: item.quoteItemId,
            quantity: item.quantity,
            subtotal: subtotal.toString()
          });
        }

        const [newOrder] = await tx
          .insert(workOrders)
          .values({
            vehicleId: input.vehicleId,
            createdBy: ctx.user.id,
            diagnosisResult: input.diagnosisResult,
            totalAmount: totalAmount.toString(),
            status: input.status,
            region: ctx.user.region || undefined
          })
          .returning();

        if (processedItems.length > 0) {
          await tx.insert(workOrderItems).values(
            processedItems.map((item) => ({
              ...item,
              workOrderId: newOrder.id
            }))
          );
        }

        return newOrder;
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: workOrderStatusEnum,
        isRework: z.boolean().optional(),
        reworkCause: z.string().optional()
      })
    )
    .mutation(async ({ input }) => {
      const updateData: Partial<typeof workOrders.$inferInsert> = {
        status: input.status
      };

      if (input.isRework !== undefined) updateData.isRework = input.isRework;
      if (input.reworkCause !== undefined) updateData.reworkCause = input.reworkCause;
      if (input.status === 'completed') updateData.completedAt = new Date();

      const [updated] = await db
        .update(workOrders)
        .set(updateData)
        .where(eq(workOrders.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '工单不存在' });
      }

      return updated;
    }),

  searchVehicles: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const vehiclesResult = await db
        .select()
        .from(vehicles)
        .where(or(ilike(vehicles.plateNumber, `%${input}%`), ilike(vehicles.vin, `%${input}%`)))
        .limit(10);
      return vehiclesResult;
    }),

  createVehicle: frontlineProcedure
    .input(
      z.object({
        plateNumber: z.string().min(1),
        vin: z.string().min(1),
        brand: z.string().optional(),
        model: z.string().optional(),
        year: z.number().int().optional(),
        currentMileage: z.number().int().default(0)
      })
    )
    .mutation(async ({ input }) => {
      const [existing] = await db
        .select()
        .from(vehicles)
        .where(or(eq(vehicles.plateNumber, input.plateNumber), eq(vehicles.vin, input.vin)))
        .limit(1);

      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: '车辆信息已存在' });
      }

      const [newVehicle] = await db.insert(vehicles).values(input).returning();
      return newVehicle;
    })
});

function or(...conditions: any[]) {
  return conditions.reduce((acc, cond) => acc.or(cond));
}
