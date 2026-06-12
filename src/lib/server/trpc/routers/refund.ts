import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { db } from '$lib/server/db';
import { refundOrderTable, refundLogTable, userTable } from '$lib/server/db/schema';
import { eq, and, desc, like, gte, lte, isNull, count, sql } from 'drizzle-orm';

export const refundRouter = createTRPCRouter({
	createOrder: protectedProcedure
		.input(
			z.object({
				orderNo: z.string(),
				communityName: z.string(),
				region: z.string(),
				customerName: z.string(),
				customerPhone: z.string(),
				productName: z.string(),
				refundAmount: z.number(),
				refundReason: z.string()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const result = await db.insert(refundOrderTable).values({
				...input,
				status: 'pending',
				currentHandlerId: ctx.user.id,
				currentHandlerName: ctx.user.realName || ctx.user.username
			}).returning();

			await db.insert(refundLogTable).values({
				refundOrderId: result[0].id,
				actionType: 'create',
				actionDetail: '创建售后单',
				newStatus: 'pending',
				operatorId: ctx.user.id,
				operatorName: ctx.user.realName || ctx.user.username
			});

			return result[0];
		}),

	getOrderList: protectedProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(20),
				status: z.string().optional(),
				region: z.string().optional(),
				handlerId: z.string().optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
				keyword: z.string().optional()
			})
		)
		.query(async ({ input }) => {
			const whereConditions = [];

			if (input.status) {
				whereConditions.push(eq(refundOrderTable.status, input.status));
			}
			if (input.region) {
				whereConditions.push(eq(refundOrderTable.region, input.region));
			}
			if (input.handlerId) {
				whereConditions.push(eq(refundOrderTable.currentHandlerId, input.handlerId));
			}
			if (input.startDate) {
				whereConditions.push(gte(refundOrderTable.createdAt, new Date(input.startDate)));
			}
			if (input.endDate) {
				whereConditions.push(lte(refundOrderTable.createdAt, new Date(input.endDate)));
			}
			if (input.keyword) {
				whereConditions.push(
					sql`(${refundOrderTable.orderNo} ILIKE ${'%' + input.keyword + '%'} OR ${refundOrderTable.customerName} ILIKE ${'%' + input.keyword + '%'})`
				);
			}

			const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;

			const [items, totalResult] = await Promise.all([
				db
					.select()
					.from(refundOrderTable)
					.where(where)
					.orderBy(desc(refundOrderTable.createdAt))
					.limit(input.pageSize)
					.offset((input.page - 1) * input.pageSize),
				db
					.select({ count: count() })
					.from(refundOrderTable)
					.where(where)
			]);

			return {
				items,
				total: totalResult[0].count,
				page: input.page,
				pageSize: input.pageSize
			};
		}),

	getOrderDetail: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input }) => {
			const order = await db
				.select()
				.from(refundOrderTable)
				.where(eq(refundOrderTable.id, input.id))
				.limit(1);

			const logs = await db
				.select()
				.from(refundLogTable)
				.where(eq(refundLogTable.refundOrderId, input.id))
				.orderBy(desc(refundLogTable.createdAt));

			return {
				order: order[0],
				logs
			};
		}),

	assignResponsibility: protectedProcedure
		.input(
			z.object({
				orderId: z.string(),
				responsibility: z.string(),
				issueTag: z.string().optional(),
				remark: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const oldOrder = await db
				.select()
				.from(refundOrderTable)
				.where(eq(refundOrderTable.id, input.orderId))
				.limit(1);

			if (oldOrder.length === 0) {
				throw new Error('售后单不存在');
			}

			const newStatus = 'processing';

			await db
				.update(refundOrderTable)
				.set({
					responsibility: input.responsibility,
					issueTag: input.issueTag,
					status: newStatus,
					updatedAt: new Date()
				})
				.where(eq(refundOrderTable.id, input.orderId));

			await db.insert(refundLogTable).values({
				refundOrderId: input.orderId,
				actionType: 'assign_responsibility',
				actionDetail: `责任归属: ${input.responsibility}${input.issueTag ? `, 问题标签: ${input.issueTag}` : ''}`,
				oldStatus: oldOrder[0].status,
				newStatus,
				operatorId: ctx.user.id,
				operatorName: ctx.user.realName || ctx.user.username,
				remark: input.remark
			});

			return { success: true };
		}),

	transferHandler: protectedProcedure
		.input(
			z.object({
				orderId: z.string(),
				newHandlerId: z.string(),
				newHandlerName: z.string(),
				remark: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const oldOrder = await db
				.select()
				.from(refundOrderTable)
				.where(eq(refundOrderTable.id, input.orderId))
				.limit(1);

			if (oldOrder.length === 0) {
				throw new Error('售后单不存在');
			}

			await db
				.update(refundOrderTable)
				.set({
					currentHandlerId: input.newHandlerId,
					currentHandlerName: input.newHandlerName,
					updatedAt: new Date()
				})
				.where(eq(refundOrderTable.id, input.orderId));

			await db.insert(refundLogTable).values({
				refundOrderId: input.orderId,
				actionType: 'transfer',
				actionDetail: `转派给: ${input.newHandlerName}`,
				oldHandlerId: oldOrder[0].currentHandlerId,
				newHandlerId: input.newHandlerId,
				operatorId: ctx.user.id,
				operatorName: ctx.user.realName || ctx.user.username,
				remark: input.remark
			});

			return { success: true };
		}),

	addFollowup: protectedProcedure
		.input(
			z.object({
				orderId: z.string(),
				result: z.string(),
				remark: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const oldOrder = await db
				.select()
				.from(refundOrderTable)
				.where(eq(refundOrderTable.id, input.orderId))
				.limit(1);

			if (oldOrder.length === 0) {
				throw new Error('售后单不存在');
			}

			await db.insert(refundLogTable).values({
				refundOrderId: input.orderId,
				actionType: 'followup',
				actionDetail: `回访结果: ${input.result}`,
				oldStatus: oldOrder[0].status,
				newStatus: oldOrder[0].status,
				operatorId: ctx.user.id,
				operatorName: ctx.user.realName || ctx.user.username,
				remark: input.remark
			});

			return { success: true };
		}),

	retryProcess: protectedProcedure
		.input(
			z.object({
				orderId: z.string(),
				reason: z.string(),
				remark: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const oldOrder = await db
				.select()
				.from(refundOrderTable)
				.where(eq(refundOrderTable.id, input.orderId))
				.limit(1);

			if (oldOrder.length === 0) {
				throw new Error('售后单不存在');
			}

			const newStatus = 'processing';

			await db
				.update(refundOrderTable)
				.set({
					status: newStatus,
					updatedAt: new Date()
				})
				.where(eq(refundOrderTable.id, input.orderId));

			await db.insert(refundLogTable).values({
				refundOrderId: input.orderId,
				actionType: 'retry',
				actionDetail: `重试处理，原因: ${input.reason}`,
				oldStatus: oldOrder[0].status,
				newStatus,
				operatorId: ctx.user.id,
				operatorName: ctx.user.realName || ctx.user.username,
				remark: input.remark
			});

			return { success: true };
		}),

	supplementRecord: protectedProcedure
		.input(
			z.object({
				orderId: z.string(),
				content: z.string(),
				recordType: z.string(),
				remark: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			await db.insert(refundLogTable).values({
				refundOrderId: input.orderId,
				actionType: 'supplement',
				actionDetail: `补录[${input.recordType}]: ${input.content}`,
				operatorId: ctx.user.id,
				operatorName: ctx.user.realName || ctx.user.username,
				remark: input.remark
			});

			return { success: true };
		}),

	escalate: protectedProcedure
		.input(
			z.object({
				orderId: z.string(),
				reason: z.string(),
				escalateTo: z.string(),
				level: z.number(),
				remark: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const oldOrder = await db
				.select()
				.from(refundOrderTable)
				.where(eq(refundOrderTable.id, input.orderId))
				.limit(1);

			if (oldOrder.length === 0) {
				throw new Error('售后单不存在');
			}

			await db
				.update(refundOrderTable)
				.set({
					status: 'escalated',
					updatedAt: new Date()
				})
				.where(eq(refundOrderTable.id, input.orderId));

			await db.insert(refundLogTable).values({
				refundOrderId: input.orderId,
				actionType: 'escalate',
				actionDetail: `升级处理 (第${input.level}级): ${input.reason}，升级至: ${input.escalateTo}`,
				oldStatus: oldOrder[0].status,
				newStatus: 'escalated',
				operatorId: ctx.user.id,
				operatorName: ctx.user.realName || ctx.user.username,
				remark: input.remark
			});

			return { success: true };
		}),

	closeOrder: protectedProcedure
		.input(
			z.object({
				orderId: z.string(),
				result: z.string(),
				remark: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const oldOrder = await db
				.select()
				.from(refundOrderTable)
				.where(eq(refundOrderTable.id, input.orderId))
				.limit(1);

			if (oldOrder.length === 0) {
				throw new Error('售后单不存在');
			}

			await db
				.update(refundOrderTable)
				.set({
					status: 'closed',
					followupResult: input.result,
					closedAt: new Date(),
					updatedAt: new Date()
				})
				.where(eq(refundOrderTable.id, input.orderId));

			await db.insert(refundLogTable).values({
				refundOrderId: input.orderId,
				actionType: 'close',
				actionDetail: `关闭售后单，最终结果: ${input.result}`,
				oldStatus: oldOrder[0].status,
				newStatus: 'closed',
				operatorId: ctx.user.id,
				operatorName: ctx.user.realName || ctx.user.username,
				remark: input.remark
			});

			return { success: true };
		}),

	getMyTodoList: protectedProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(20),
				status: z.string().optional()
			})
		)
		.query(async ({ input, ctx }) => {
			const whereConditions = [eq(refundOrderTable.currentHandlerId, ctx.user.id)];

			if (input.status) {
				whereConditions.push(eq(refundOrderTable.status, input.status));
			} else {
				whereConditions.push(sql`${refundOrderTable.status} NOT IN ('closed')`);
			}

			const where = and(...whereConditions);

			const [items, totalResult] = await Promise.all([
				db
					.select()
					.from(refundOrderTable)
					.where(where)
					.orderBy(desc(refundOrderTable.createdAt))
					.limit(input.pageSize)
					.offset((input.page - 1) * input.pageSize),
				db
					.select({ count: count() })
					.from(refundOrderTable)
					.where(where)
			]);

			return {
				items,
				total: totalResult[0].count,
				page: input.page,
				pageSize: input.pageSize
			};
		})
});
