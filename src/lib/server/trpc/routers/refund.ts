import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '$lib/server/db';
import { refundOrderTable, refundLogTable, userTable } from '$lib/server/db/schema';
import { eq, and, desc, gte, lte, count, sql, or, ilike } from 'drizzle-orm';
import { getDueAt, checkAndProcessTimeouts, resolveEscalationTargetWithFallback } from '../timeout';

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
			const dueAt = await getDueAt('pending');

			const result = await db.insert(refundOrderTable).values({
				...input,
				status: 'pending',
				currentHandlerId: ctx.user.id,
				currentHandlerName: ctx.user.realName || ctx.user.username,
				dueAt
			}).returning();

			await db.insert(refundLogTable).values({
				refundOrderId: result[0].id,
				actionType: 'create',
				actionDetail: `创建售后单${dueAt ? '，处理截止: ' + dueAt.toISOString() : ''}`,
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
			await checkAndProcessTimeouts();

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
			const dueAt = await getDueAt('processing');

			await db
				.update(refundOrderTable)
				.set({
					responsibility: input.responsibility,
					issueTag: input.issueTag,
					status: newStatus,
					dueAt,
					updatedAt: new Date()
				})
				.where(eq(refundOrderTable.id, input.orderId));

			await db.insert(refundLogTable).values({
				refundOrderId: input.orderId,
				actionType: 'assign_responsibility',
				actionDetail: `责任归属: ${input.responsibility}${input.issueTag ? `, 问题标签: ${input.issueTag}` : ''}${dueAt ? '，处理截止: ' + dueAt.toISOString() : ''}`,
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

			const dueAt = await getDueAt(oldOrder[0].status);

			await db
				.update(refundOrderTable)
				.set({
					currentHandlerId: input.newHandlerId,
					currentHandlerName: input.newHandlerName,
					dueAt,
					updatedAt: new Date()
				})
				.where(eq(refundOrderTable.id, input.orderId));

			await db.insert(refundLogTable).values({
				refundOrderId: input.orderId,
				actionType: 'transfer',
				actionDetail: `转派给: ${input.newHandlerName}${dueAt ? '，重置截止: ' + dueAt.toISOString() : ''}`,
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
			const dueAt = await getDueAt('processing');

			await db
				.update(refundOrderTable)
				.set({
					status: newStatus,
					dueAt,
					updatedAt: new Date()
				})
				.where(eq(refundOrderTable.id, input.orderId));

			await db.insert(refundLogTable).values({
				refundOrderId: input.orderId,
				actionType: 'retry',
				actionDetail: `重试处理，原因: ${input.reason}${dueAt ? '，处理截止: ' + dueAt.toISOString() : ''}`,
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
				escalateToUserId: z.string().optional(),
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

			let newHandlerId = oldOrder[0].currentHandlerId;
			let newHandlerName = oldOrder[0].currentHandlerName;
			let targetNote = '';

			if (input.escalateToUserId) {
				const targetUser = await db
					.select()
					.from(userTable)
					.where(eq(userTable.id, input.escalateToUserId))
					.limit(1);
				if (targetUser.length > 0) {
					newHandlerId = targetUser[0].id;
					newHandlerName = targetUser[0].realName || targetUser[0].username;
					targetNote = `，分派给: ${newHandlerName}`;
				}
			} else {
				const roleMatch = await db
					.select()
					.from(userTable)
					.where(or(eq(userTable.role, input.escalateTo), ilike(userTable.role, '%' + input.escalateTo + '%')))
					.limit(1);
				if (roleMatch.length > 0) {
					newHandlerId = roleMatch[0].id;
					newHandlerName = roleMatch[0].realName || roleMatch[0].username;
					targetNote = `（角色匹配「${roleMatch[0].role}」），分派给: ${newHandlerName}`;
				} else {
					const nameMatch = await db
						.select()
						.from(userTable)
						.where(or(
							ilike(userTable.username, '%' + input.escalateTo + '%'),
							ilike(userTable.realName, '%' + input.escalateTo + '%')
						))
						.limit(1);
					if (nameMatch.length > 0) {
						newHandlerId = nameMatch[0].id;
						newHandlerName = nameMatch[0].realName || nameMatch[0].username;
						targetNote = `（姓名匹配），分派给: ${newHandlerName}`;
					} else {
						const admins = await db
							.select()
							.from(userTable)
							.where(eq(userTable.role, 'admin'))
							.limit(1);
						if (admins.length > 0) {
							newHandlerId = admins[0].id;
							newHandlerName = admins[0].realName || admins[0].username;
							targetNote = `（未找到匹配目标，已 fallback 管理员），分派给: ${newHandlerName}`;
						}
					}
				}
			}

			const dueAt = await getDueAt('escalated');

			await db
				.update(refundOrderTable)
				.set({
					status: 'escalated',
					currentHandlerId: newHandlerId,
					currentHandlerName: newHandlerName,
					dueAt,
					updatedAt: new Date()
				})
				.where(eq(refundOrderTable.id, input.orderId));

			await db.insert(refundLogTable).values({
				refundOrderId: input.orderId,
				actionType: 'escalate',
				actionDetail: `升级处理 (第${input.level}级): ${input.reason}，升级至: ${input.escalateTo}${targetNote}${dueAt ? '，处理截止: ' + dueAt.toISOString() : ''}`,
				oldStatus: oldOrder[0].status,
				newStatus: 'escalated',
				oldHandlerId: oldOrder[0].currentHandlerId,
				newHandlerId,
				operatorId: ctx.user.id,
				operatorName: ctx.user.realName || ctx.user.username,
				remark: input.remark
			});

			return { success: true, newHandlerId, newHandlerName };
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
					dueAt: null,
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
			await checkAndProcessTimeouts();

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
		}),

	checkTimeouts: protectedProcedure.mutation(async () => {
		const count = await checkAndProcessTimeouts();
		return { processed: count };
	})
});
