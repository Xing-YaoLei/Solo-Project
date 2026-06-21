import { z } from 'zod';
import { router, protectedProcedure, operatorProcedure, financeProcedure } from '../trpc/trpc';
import { and, desc, eq, sql, sum, gte, lte, inArray } from 'drizzle-orm';
import {
	orders,
	orderItems,
	ticketTypes,
	verifications,
	statusTransitions,
	type NewOrder,
	type NewOrderItem
} from '../db/schema';
import type {
	PaginationOutput,
	OrderStatus,
	OrderChannel,
	PaymentStatus
} from '$lib/shared/types';
import { randomUUID } from 'crypto';

export const orderRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(20),
				eventId: z.string().optional(),
				channel: z.string().optional(),
				status: z.string().optional(),
				paymentStatus: z.string().optional(),
				orderNo: z.string().optional(),
				buyerName: z.string().optional(),
				buyerPhone: z.string().optional(),
				dateRange: z.object({ startDate: z.string().optional(), endDate: z.string().optional() }).optional()
			})
		)
		.query(async ({ ctx, input }): Promise<PaginationOutput<(typeof orders.$inferSelect)[]>> => {
			const { page, pageSize, eventId, channel, status, paymentStatus, orderNo, buyerName, buyerPhone, dateRange } =
				input;
			const offset = (page - 1) * pageSize;

			const where = [];
			if (eventId) where.push(eq(orders.eventId, eventId));
			if (channel) where.push(eq(orders.channel, channel as OrderChannel));
			if (status) where.push(eq(orders.status, status as OrderStatus));
			if (paymentStatus) where.push(eq(orders.paymentStatus, paymentStatus as PaymentStatus));
			if (orderNo) where.push(sql`${orders.orderNo} ILIKE ${`%${orderNo}%`}`);
			if (buyerName) where.push(sql`${orders.buyerName} ILIKE ${`%${buyerName}%`}`);
			if (buyerPhone) where.push(sql`${orders.buyerPhone} ILIKE ${`%${buyerPhone}%`}`);
			if (dateRange?.startDate) where.push(gte(orders.createdAt, dateRange.startDate));
			if (dateRange?.endDate) where.push(lte(orders.createdAt, dateRange.endDate));

			const [items, countResult] = await Promise.all([
				ctx.db
					.select()
					.from(orders)
					.where(where.length ? and(...where) : undefined)
					.orderBy(desc(orders.createdAt))
					.limit(pageSize)
					.offset(offset),
				ctx.db
					.select({ count: sql<number>`count(*)` })
					.from(orders)
					.where(where.length ? and(...where) : undefined)
			]);

			const total = countResult[0]?.count ?? 0;
			return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
		}),

	get: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const [order, items, transitions] = await Promise.all([
				ctx.db.query.orders.findFirst({ where: eq(orders.id, input.id) }),
				ctx.db
					.select({
						item: orderItems,
						ticketType: ticketTypes.name,
						verification: verifications
					})
					.from(orderItems)
					.leftJoin(ticketTypes, eq(orderItems.ticketTypeId, ticketTypes.id))
					.leftJoin(verifications, eq(orderItems.verificationId, verifications.id))
					.where(eq(orderItems.orderId, input.id)),
				ctx.db
					.select()
					.from(statusTransitions)
					.where(
						and(eq(statusTransitions.entityType, 'order'), eq(statusTransitions.entityId, input.id))
					)
					.orderBy(desc(statusTransitions.createdAt))
			]);
			return { order, items, transitions };
		}),

	create: operatorProcedure
		.input(
			z.object({
				eventId: z.string(),
				channel: z.string(),
				thirdPartySource: z.string().optional(),
				buyerName: z.string().optional(),
				buyerPhone: z.string().optional(),
				buyerEmail: z.string().optional(),
				paymentMethod: z.string().optional(),
				paymentStatus: z.string().optional(),
				notes: z.string().optional(),
				items: z.array(
					z.object({
						ticketTypeId: z.string(),
						seatId: z.string().optional(),
						quantity: z.number().min(1),
						unitPrice: z.string(),
						holderName: z.string().optional(),
						holderPhone: z.string().optional(),
						holderIdCard: z.string().optional()
					})
				).min(1)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const orderId = randomUUID();
			const orderNo = `ORD${Date.now()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

			const result = await ctx.db.transaction(async (tx) => {
				let totalAmount = '0';
				let totalQuantity = 0;

				const orderItemsToInsert: NewOrderItem[] = [];
				for (const it of input.items) {
					const quantity = it.quantity;
					totalQuantity += quantity;
					const unitNum = parseFloat(it.unitPrice) || 0;
					const totalPrice = (unitNum * quantity).toFixed(2);
					totalAmount = (parseFloat(totalAmount) + parseFloat(totalPrice)).toFixed(2);

					for (let i = 0; i < quantity; i++) {
						const verificationId = randomUUID();
						orderItemsToInsert.push({
							id: randomUUID(),
							orderId,
							ticketTypeId: it.ticketTypeId,
							seatId: it.seatId ?? null,
							quantity: 1,
							unitPrice: it.unitPrice,
							totalPrice: it.unitPrice,
							holderName: it.holderName ?? null,
							holderPhone: it.holderPhone ?? null,
							holderIdCard: it.holderIdCard ?? null,
							verificationId,
							status: 'pending'
						});
					}
				}

				const [createdOrder] = await tx
					.insert(orders)
					.values({
						id: orderId,
						eventId: input.eventId,
						orderNo,
						channel: input.channel as OrderChannel,
						thirdPartySource: input.thirdPartySource ?? null,
						buyerName: input.buyerName ?? null,
						buyerPhone: input.buyerPhone ?? null,
						buyerEmail: input.buyerEmail ?? null,
						totalAmount,
						totalQuantity,
						discountAmount: '0',
						paidAmount: input.paymentStatus === 'paid' ? totalAmount : '0',
						serviceFee: '0',
						paymentMethod: input.paymentMethod ?? null,
						paymentStatus: (input.paymentStatus ?? 'unpaid') as PaymentStatus,
						paymentTime: input.paymentStatus === 'paid' ? new Date() : null,
						status: input.paymentStatus === 'paid' ? 'paid' : 'created',
						notes: input.notes ?? null
					} satisfies NewOrder)
					.returning();

				const insertedItems = await tx.insert(orderItems).values(orderItemsToInsert).returning();

				for (const i of insertedItems) {
					const serial = `TK-${Date.now().toString().slice(-6)}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
					await tx.insert(verifications).values({
						id: i.verificationId!,
						eventId: input.eventId,
						sourceType: 'online_order',
						sourceId: orderId,
						serialNumber: serial,
						ticketTypeId: i.ticketTypeId ?? null,
						seatId: i.seatId ?? null,
						holderName: i.holderName ?? null,
						holderPhone: i.holderPhone ?? null,
						holderIdCard: i.holderIdCard ?? null,
						status: 'issued'
					});

					await tx
						.update(ticketTypes)
						.set({ soldQuota: sql`${ticketTypes.soldQuota} + 1`, updatedAt: new Date() })
						.where(eq(ticketTypes.id, i.ticketTypeId!));
				}

				await tx.insert(statusTransitions).values({
					id: randomUUID(),
					eventId: input.eventId,
					entityType: 'order' as any,
					entityId: orderId,
					fromStatus: null,
					toStatus: createdOrder.status,
					transitionType: 'order_created',
					operatorId: ctx.user.id,
					triggerSource: 'operator',
					remark: `创建订单 ${orderNo}，${totalQuantity} 张票，金额 ${totalAmount}`
				});

				return { order: createdOrder, items: insertedItems };
			});

			return result;
		}),

	updateStatus: operatorProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.string(),
				reason: z.string().optional(),
				transactionId: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const original = await ctx.db.query.orders.findFirst({ where: eq(orders.id, input.id) });
			if (!original) throw new Error('订单不存在');

			const [updated] = await ctx.db.transaction(async (tx) => {
				const [u] = await tx
					.update(orders)
					.set({
						status: input.status as OrderStatus,
						transactionId: input.transactionId ?? original.transactionId,
						paymentStatus:
							input.status === 'paid' || input.status === 'issued'
								? 'paid'
								: input.status === 'refunded'
									? 'refunded'
									: original.paymentStatus,
						paymentTime:
							input.status === 'paid' || input.status === 'issued' ? new Date() : original.paymentTime,
						updatedAt: new Date()
					})
					.where(eq(orders.id, input.id))
					.returning();

				await tx.insert(statusTransitions).values({
					id: randomUUID(),
					eventId: original.eventId,
					entityType: 'order' as any,
					entityId: input.id,
					fromStatus: original.status,
					toStatus: input.status,
					transitionType: 'order_status_change',
					operatorId: ctx.user.id,
					triggerSource: 'operator',
					remark: input.reason ?? `订单状态变更: ${original.status} → ${input.status}`
				});

				return [u];
			});

			return updated;
		}),

	refund: financeProcedure
		.input(
			z.object({
				id: z.string(),
				orderItemIds: z.array(z.string()).optional(),
				refundAmount: z.string(),
				reason: z.string().optional(),
				fullRefund: z.boolean().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const original = await ctx.db.query.orders.findFirst({ where: eq(orders.id, input.id) });
			if (!original) throw new Error('订单不存在');

			const items = await ctx.db
				.select()
				.from(orderItems)
				.where(eq(orderItems.orderId, input.id));

			const targetItemIds = input.orderItemIds && input.orderItemIds.length > 0
				? input.orderItemIds
				: items.map((i) => i.id);

			const result = await ctx.db.transaction(async (tx) => {
				let refundCount = 0;
				for (const item of items) {
					if (targetItemIds.includes(item.id) && item.status !== 'refunded') {
						await tx
							.update(orderItems)
							.set({
								status: 'refunded',
								refundAmount: item.totalPrice
							})
							.where(eq(orderItems.id, item.id));

						await tx
							.update(verifications)
							.set({ status: 'refunded', updatedAt: new Date() })
							.where(eq(verifications.id, item.verificationId!));

						await tx
							.update(ticketTypes)
							.set({ soldQuota: sql`${ticketTypes.soldQuota} - 1` })
							.where(eq(ticketTypes.id, item.ticketTypeId!));
						refundCount++;
					}
				}

				const newStatus = input.fullRefund ? 'refunded' : 'partial_refund';
				const newPaymentStatus = input.fullRefund ? 'refunded' : 'partial_refund';

				const [updated] = await tx
					.update(orders)
					.set({
						status: newStatus as OrderStatus,
						paymentStatus: newPaymentStatus as PaymentStatus,
						paidAmount: sql`${orders.paidAmount} - ${input.refundAmount}::numeric`,
						updatedAt: new Date()
					})
					.where(eq(orders.id, input.id))
					.returning();

				await tx.insert(statusTransitions).values({
					id: randomUUID(),
					eventId: original.eventId,
					entityType: 'order' as any,
					entityId: input.id,
					fromStatus: original.status,
					toStatus: newStatus,
					transitionType: 'order_refunded',
					operatorId: ctx.user.id,
					triggerSource: 'finance',
					metadata: {
						refundAmount: input.refundAmount,
						refundCount
					},
					remark: input.reason ?? `退款 ${refundCount} 张，金额 ${input.refundAmount}`
				});

				return { order: updated, refundCount };
			});

			return result;
		}),

	statistics: protectedProcedure
		.input(
			z.object({
				eventId: z.string().optional(),
				dateRange: z.object({ startDate: z.string().optional(), endDate: z.string().optional() }).optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const where = [];
			if (input.eventId) where.push(eq(orders.eventId, input.eventId));
			if (input.dateRange?.startDate) where.push(gte(orders.createdAt, input.dateRange.startDate));
			if (input.dateRange?.endDate) where.push(lte(orders.createdAt, input.dateRange.endDate));
			const wc = where.length ? and(...where) : undefined;

			const [overview] = await ctx.db
				.select({
					orderCount: sql<number>`count(*)`,
					ticketCount: sum(orders.totalQuantity).mapWith(String),
					totalAmount: sum(orders.totalAmount).mapWith(String),
					paidAmount: sum(orders.paidAmount).mapWith(String),
					paidOrderCount: sql<number>`sum(case when ${orders.paymentStatus} = 'paid' then 1 else 0 end)`
				})
				.from(orders)
				.where(wc);

			const byStatus = await ctx.db
				.select({
					status: orders.status,
					count: sql<number>`count(*)`,
					amount: sum(orders.totalAmount).mapWith(String)
				})
				.from(orders)
				.where(wc)
				.groupBy(orders.status);

			const byChannel = await ctx.db
				.select({
					channel: orders.channel,
					count: sql<number>`count(*)`,
					amount: sum(orders.totalAmount).mapWith(String)
				})
				.from(orders)
				.where(wc)
				.groupBy(orders.channel);

			return { overview, byStatus, byChannel };
		})
});
