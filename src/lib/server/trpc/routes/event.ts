import { z } from 'zod';
import { router, protectedProcedure, operatorProcedure, adminProcedure } from '../trpc/trpc';
import { and, desc, eq, sql } from 'drizzle-orm';
import { events, users, statusTransitions, type NewEvent } from '../db/schema';
import type { PaginationOutput, EventStatus, EventCategory } from '$lib/shared/types';
import { randomUUID } from 'crypto';

export const eventRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(20),
				status: z.string().optional(),
				category: z.string().optional(),
				keyword: z.string().optional()
			})
		)
		.query(async ({ ctx, input }): Promise<PaginationOutput<(typeof events.$inferSelect)[]>> => {
			const { page, pageSize, status, category, keyword } = input;
			const offset = (page - 1) * pageSize;

			const where = [];
			if (status) where.push(eq(events.status, status as EventStatus));
			if (category) where.push(eq(events.category, category as EventCategory));
			if (keyword) {
				where.push(
					sql`(${events.name} ILIKE ${`%${keyword}%`} OR ${events.code} ILIKE ${`%${keyword}%`} OR ${events.venue} ILIKE ${`%${keyword}%`})`
				);
			}

			const [items, countResult] = await Promise.all([
				ctx.db
					.select({
						event: events,
						creatorName: users.displayName
					})
					.from(events)
					.leftJoin(users, eq(events.createdBy, users.id))
					.where(where.length ? and(...where) : undefined)
					.orderBy(desc(events.createdAt))
					.limit(pageSize)
					.offset(offset),
				ctx.db
					.select({ count: sql<number>`count(*)` })
					.from(events)
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
		}),

	get: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const [event, transitions] = await Promise.all([
				ctx.db.query.events.findFirst({ where: eq(events.id, input.id) }),
				ctx.db
					.select()
					.from(statusTransitions)
					.where(eq(statusTransitions.eventId, input.id))
					.orderBy(desc(statusTransitions.createdAt))
					.limit(100)
			]);
			return { event, transitions };
		}),

	create: operatorProcedure
		.input(
			z.object({
				code: z.string().min(1),
				name: z.string().min(1),
				description: z.string().optional(),
				category: z.string(),
				venue: z.string().optional(),
				startTime: z.string().optional(),
				endTime: z.string().optional(),
				posterUrl: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = randomUUID();
			const [created] = await ctx.db.transaction(async (tx) => {
				const [c] = await tx
					.insert(events)
					.values({
						id,
						code: input.code,
						name: input.name,
						description: input.description ?? null,
						category: input.category as EventCategory,
						venue: input.venue ?? null,
						startTime: input.startTime ? new Date(input.startTime) : null,
						endTime: input.endTime ? new Date(input.endTime) : null,
						posterUrl: input.posterUrl ?? null,
						status: 'draft' as EventStatus,
						createdBy: ctx.user.id
					} satisfies NewEvent)
					.returning();

				await tx.insert(statusTransitions).values({
					id: randomUUID(),
					eventId: id,
					entityType: 'dispute' as any,
					entityId: id,
					fromStatus: null,
					toStatus: 'draft',
					transitionType: 'event_created',
					operatorId: ctx.user.id,
					triggerSource: 'operator',
					remark: `创建活动: ${input.name} (${input.code})`
				});

				return [c];
			});
			return created;
		}),

	update: operatorProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).optional(),
				description: z.string().optional(),
				category: z.string().optional(),
				venue: z.string().optional(),
				startTime: z.string().optional(),
				endTime: z.string().optional(),
				posterUrl: z.string().optional(),
				status: z.string().optional(),
				reason: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, reason, ...data } = input;
			const original = await ctx.db.query.events.findFirst({ where: eq(events.id, id) });
			if (!original) throw new Error('活动不存在');

			const [updated] = await ctx.db.transaction(async (tx) => {
				const [u] = await tx
					.update(events)
					.set({
						...data,
						startTime: data.startTime ? new Date(data.startTime) : original.startTime,
						endTime: data.endTime ? new Date(data.endTime) : original.endTime,
						updatedAt: new Date()
					})
					.where(eq(events.id, id))
					.returning();

				if (data.status && original.status !== data.status) {
					await tx.insert(statusTransitions).values({
						id: randomUUID(),
						eventId: id,
						entityType: 'dispute' as any,
						entityId: id,
						fromStatus: original.status,
						toStatus: data.status,
						transitionType: 'event_status_change',
						operatorId: ctx.user.id,
						triggerSource: 'operator',
						remark: reason ?? `活动状态: ${original.status} → ${data.status}`
					});
				}

				return [u];
			});

			return updated;
		}),

	dashboard: protectedProcedure
		.input(z.object({ eventId: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			const stats = await ctx.db
				.select({
					totalEvents: sql<number>`count(*)`,
					draftEvents: sql<number>`sum(case when ${events.status} = 'draft' then 1 else 0 end)`,
					readyEvents: sql<number>`sum(case when ${events.status} = 'ready' then 1 else 0 end)`,
					sellingEvents: sql<number>`sum(case when ${events.status} = 'selling' then 1 else 0 end)`,
					endedEvents: sql<number>`sum(case when ${events.status} = 'ended' then 1 else 0 end)`
				})
				.from(events);

			const recent = await ctx.db
				.select({ event: events, creator: users.displayName })
				.from(events)
				.leftJoin(users, eq(events.createdBy, users.id))
				.orderBy(desc(events.createdAt))
				.limit(10);

			return { overview: stats[0], recent };
		})
});
