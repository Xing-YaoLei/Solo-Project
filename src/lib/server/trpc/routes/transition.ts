import { z } from 'zod';
import { router, protectedProcedure, operatorProcedure } from '../trpc/trpc';
import { and, desc, eq, sql, gte, lte } from 'drizzle-orm';
import {
	statusTransitions,
	events,
	orders,
	verifications,
	disputeTickets,
	users
} from '../db/schema';
import type { PaginationOutput, EntityType } from '$lib/shared/types';

export const transitionRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(50),
				eventId: z.string().optional(),
				entityType: z.string().optional(),
				entityId: z.string().optional(),
				operatorId: z.string().optional(),
				transitionType: z.string().optional(),
				dateRange: z.object({ startDate: z.string().optional(), endDate: z.string().optional() }).optional()
			})
		)
		.query(
			async ({ ctx, input }): Promise<PaginationOutput<(typeof statusTransitions.$inferSelect)[]>> => {
				const { page, pageSize, eventId, entityType, entityId, operatorId, transitionType, dateRange } =
					input;
				const offset = (page - 1) * pageSize;

				const where = [];
				if (eventId) where.push(eq(statusTransitions.eventId, eventId));
				if (entityType) where.push(eq(statusTransitions.entityType, entityType as EntityType));
				if (entityId) where.push(eq(statusTransitions.entityId, entityId));
				if (operatorId) where.push(eq(statusTransitions.operatorId, operatorId));
				if (transitionType) where.push(sql`${statusTransitions.transitionType} ILIKE ${`%${transitionType}%`}`);
				if (dateRange?.startDate) where.push(gte(statusTransitions.createdAt, dateRange.startDate));
				if (dateRange?.endDate) where.push(lte(statusTransitions.createdAt, dateRange.endDate));

				const [items, countResult] = await Promise.all([
					ctx.db
						.select({
							transition: statusTransitions,
							operatorName: users.displayName,
							eventName: events.name
						})
						.from(statusTransitions)
						.leftJoin(users, eq(statusTransitions.operatorId, users.id))
						.leftJoin(events, eq(statusTransitions.eventId, events.id))
						.where(where.length ? and(...where) : undefined)
						.orderBy(desc(statusTransitions.createdAt))
						.limit(pageSize)
						.offset(offset),
					ctx.db
						.select({ count: sql<number>`count(*)` })
						.from(statusTransitions)
						.where(where.length ? and(...where) : undefined)
				]);

				const total = countResult[0]?.count ?? 0;
				return {
					items: items as any,
					total,
					page,
					pageSize,
					totalPages: Math.ceil(total / pageSize)
				};
			}
		),

	getEntityTimeline: protectedProcedure
		.input(
			z.object({
				entityType: z.string(),
				entityId: z.string()
			})
		)
		.query(async ({ ctx, input }) => {
			const transitions = await ctx.db
				.select({
					transition: statusTransitions,
					operatorName: users.displayName,
					operatorUsername: users.username,
					operatorAvatar: users.avatarUrl
				})
				.from(statusTransitions)
				.leftJoin(users, eq(statusTransitions.operatorId, users.id))
				.where(
					and(
						eq(statusTransitions.entityType, input.entityType as EntityType),
						eq(statusTransitions.entityId, input.entityId)
					)
				)
				.orderBy(desc(statusTransitions.createdAt));

			let entityInfo: any = null;
			switch (input.entityType) {
				case 'order':
					entityInfo = await ctx.db.query.orders.findFirst({ where: eq(orders.id, input.entityId) });
					break;
				case 'verification':
					entityInfo = await ctx.db.query.verifications.findFirst({
						where: eq(verifications.id, input.entityId)
					});
					break;
				case 'dispute':
					entityInfo = await ctx.db.query.disputeTickets.findFirst({
						where: eq(disputeTickets.id, input.entityId)
					});
					break;
			}

			return { transitions, entityInfo };
		})
});
