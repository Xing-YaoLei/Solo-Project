import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '$lib/server/db';
import {
	afterSalesOrders,
	attachments,
	notes,
	flowRecords,
	users
} from '$lib/server/db/schema';
import type { AfterSalesOrder, Attachment, Note, FlowRecord } from '$lib/server/db/schema';
import { eq, desc, ilike, and, type SQL } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

type AfterSalesOrderWithDetails = AfterSalesOrder & {
	attachments: Attachment[];
	notes: Note[];
	flowRecords: FlowRecord[];
};

export const afterSalesOrdersRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(20),
				search: z.string().optional(),
				projectId: z.string().uuid().optional(),
				changeOrderId: z.string().uuid().optional(),
				status: z.enum(['draft', 'pending', 'processing', 'approved', 'rejected', 'completed', 'cancelled']).optional(),
				priority: z.enum(['low', 'normal', 'high', 'urgent']).optional()
			})
		)
		.query(async ({ input }) => {
			const where: SQL<unknown>[] = [];
			if (input.search) {
				where.push(ilike(afterSalesOrders.title, `%${input.search}%`));
			}
			if (input.projectId) {
				where.push(eq(afterSalesOrders.projectId, input.projectId));
			}
			if (input.changeOrderId) {
				where.push(eq(afterSalesOrders.changeOrderId, input.changeOrderId));
			}
			if (input.status) {
				where.push(eq(afterSalesOrders.status, input.status));
			}
			if (input.priority) {
				where.push(eq(afterSalesOrders.priority, input.priority));
			}

			const data = await db
				.select()
				.from(afterSalesOrders)
				.where(where.length > 0 ? and(...where) : undefined)
				.orderBy(desc(afterSalesOrders.createdAt))
				.limit(input.pageSize)
				.offset((input.page - 1) * input.pageSize);

			const total = await db.$count(afterSalesOrders, where.length > 0 ? and(...where) : undefined);

			return { data, total, page: input.page, pageSize: input.pageSize };
		}),

	get: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ input }) => {
			const [order] = await db
				.select()
				.from(afterSalesOrders)
				.where(eq(afterSalesOrders.id, input.id))
				.limit(1);

			if (!order) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '售后工单不存在' });
			}

			const [orderAttachments, orderNotes, orderFlowRecords] = await Promise.all([
				db
					.select()
					.from(attachments)
					.where(
						and(
							eq(attachments.documentId, input.id),
							eq(attachments.documentType, 'after_sales_order')
						)
					),
				db
					.select()
					.from(notes)
					.where(
						and(
							eq(notes.documentId, input.id),
							eq(notes.documentType, 'after_sales_order')
						)
					),
				db
					.select()
					.from(flowRecords)
					.where(
						and(
							eq(flowRecords.documentId, input.id),
							eq(flowRecords.documentType, 'after_sales_order')
						)
					)
					.orderBy(desc(flowRecords.createdAt))
			]);

			return {
				...order,
				attachments: orderAttachments,
				notes: orderNotes,
				flowRecords: orderFlowRecords
			} as AfterSalesOrderWithDetails;
		}),

	create: protectedProcedure
		.input(
			z.object({
				projectId: z.string().uuid(),
				changeOrderId: z.string().uuid().optional(),
				title: z.string().min(1).max(200),
				type: z.string().optional(),
				description: z.string().optional(),
				priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
				reportedByName: z.string().optional(),
				reportedByPhone: z.string().optional(),
				photos: z.array(z.string()).optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const today = new Date();
			const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
			const prefix = `AS${dateStr}`;

			const lastOrder = await db
				.select({ code: afterSalesOrders.code })
				.from(afterSalesOrders)
				.where(ilike(afterSalesOrders.code, `${prefix}%`))
				.orderBy(desc(afterSalesOrders.code))
				.limit(1);

			let sequence = 1;
			if (lastOrder.length > 0 && lastOrder[0]?.code) {
				const lastSeq = parseInt(lastOrder[0].code!.slice(prefix.length), 10);
				if (!isNaN(lastSeq)) {
					sequence = lastSeq + 1;
				}
			}
			const code = `${prefix}${String(sequence).padStart(4, '0')}`;

			const [order] = await db
				.insert(afterSalesOrders)
				.values({
					...input,
					code,
					status: 'pending',
					createdById: ctx.user.id
				})
				.returning();

			await db.insert(flowRecords).values({
				documentId: order!.id,
				documentType: 'after_sales_order',
				toStatus: 'pending',
				action: 'create',
				comments: '售后工单创建',
				performedById: ctx.user.id
			});

			return order as AfterSalesOrder;
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				title: z.string().min(1).max(200).optional(),
				type: z.string().optional(),
				description: z.string().optional(),
				priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
				reportedByName: z.string().optional(),
				reportedByPhone: z.string().optional(),
				resolution: z.string().optional(),
				photos: z.array(z.string()).optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { id, ...data } = input;
			const [order] = await db
				.update(afterSalesOrders)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(afterSalesOrders.id, id))
				.returning();

			if (!order) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '售后工单不存在' });
			}

			return order as AfterSalesOrder;
		}),

	updateStatus: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				status: z.enum(['draft', 'pending', 'processing', 'approved', 'rejected', 'completed', 'cancelled']),
				comments: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const [existing] = await db
				.select()
				.from(afterSalesOrders)
				.where(eq(afterSalesOrders.id, input.id))
				.limit(1);

			if (!existing) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '售后工单不存在' });
			}

			const updateData: Partial<AfterSalesOrder> = {
				status: input.status,
				updatedAt: new Date()
			};

			if (input.status === 'completed') {
				updateData.completedTime = new Date();
			}

			const [order] = await db
				.update(afterSalesOrders)
				.set(updateData)
				.where(eq(afterSalesOrders.id, input.id))
				.returning();

			await db.insert(flowRecords).values({
				documentId: input.id,
				documentType: 'after_sales_order',
				fromStatus: existing.status,
				toStatus: input.status,
				action: 'update_status',
				comments: input.comments,
				performedById: ctx.user.id
			});

			return order as AfterSalesOrder;
		}),

	assign: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				assignedToId: z.string().uuid()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const [assignedUser] = await db
				.select()
				.from(users)
				.where(eq(users.id, input.assignedToId))
				.limit(1);

			if (!assignedUser) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '分配的用户不存在' });
			}

			const [order] = await db
				.update(afterSalesOrders)
				.set({
					assignedToId: input.assignedToId,
					updatedAt: new Date()
				})
				.where(eq(afterSalesOrders.id, input.id))
				.returning();

			if (!order) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '售后工单不存在' });
			}

			await db.insert(flowRecords).values({
				documentId: input.id,
				documentType: 'after_sales_order',
				toStatus: order!.status,
				action: 'assign',
				comments: `分配给 ${assignedUser.fullName}`,
				performedById: ctx.user.id
			});

			return order as AfterSalesOrder;
		}),

	schedule: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				scheduledTime: z.date()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const [order] = await db
				.update(afterSalesOrders)
				.set({
					scheduledTime: input.scheduledTime,
					updatedAt: new Date()
				})
				.where(eq(afterSalesOrders.id, input.id))
				.returning();

			if (!order) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '售后工单不存在' });
			}

			await db.insert(flowRecords).values({
				documentId: input.id,
				documentType: 'after_sales_order',
				toStatus: order.status,
				action: 'schedule',
				comments: `安排处理时间：${input.scheduledTime.toLocaleString('zh-CN')}`,
				performedById: ctx.user.id
			});

			return order as AfterSalesOrder;
		})
});
