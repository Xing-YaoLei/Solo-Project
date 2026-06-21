import { z } from 'zod';
import { router, protectedProcedure, operatorProcedure, adminProcedure } from '../trpc/trpc';
import { and, desc, eq, sql, sum, isNull } from 'drizzle-orm';
import {
	ticketTypes,
	statusTransitions,
	orderItems,
	seats,
	type NewTicketType
} from '../db/schema';
import type { PaginationOutput, TicketCategory, TicketTypeStatus } from '$lib/shared/types';
import { randomUUID } from 'crypto';

export const ticketTypeRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(20),
				eventId: z.string().optional(),
				category: z.string().optional(),
				status: z.string().optional(),
				keyword: z.string().optional()
			})
		)
		.query(async ({ ctx, input }): Promise<PaginationOutput<(typeof ticketTypes.$inferSelect)[]>> => {
			const { page, pageSize, eventId, category, status, keyword } = input;
			const offset = (page - 1) * pageSize;

			const where = [];
			if (eventId) where.push(eq(ticketTypes.eventId, eventId));
			if (category) where.push(eq(ticketTypes.category, category as TicketCategory));
			if (status) where.push(eq(ticketTypes.status, status as TicketTypeStatus));
			if (keyword) {
				where.push(
					sql`(${ticketTypes.name} ILIKE ${`%${keyword}%`} OR ${ticketTypes.code} ILIKE ${`%${keyword}%`})`
				);
			}

			const [items, countResult] = await Promise.all([
				ctx.db
					.select()
					.from(ticketTypes)
					.where(where.length ? and(...where) : undefined)
					.orderBy(desc(ticketTypes.createdAt))
					.limit(pageSize)
					.offset(offset),
				ctx.db
					.select({ count: sql<number>`count(*)` })
					.from(ticketTypes)
					.where(where.length ? and(...where) : undefined)
			]);

			const total = countResult[0]?.count ?? 0;
			return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
		}),

	get: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const [ticketType, transitions] = await Promise.all([
				ctx.db.query.ticketTypes.findFirst({ where: eq(ticketTypes.id, input.id) }),
				ctx.db
					.select()
					.from(statusTransitions)
					.where(
						and(eq(statusTransitions.entityType, 'ticket_type'), eq(statusTransitions.entityId, input.id))
					)
					.orderBy(desc(statusTransitions.createdAt))
			]);
			return { ticketType, transitions };
		}),

	create: operatorProcedure
		.input(
			z.object({
				eventId: z.string(),
				code: z.string().min(1),
				name: z.string().min(1),
				description: z.string().optional(),
				category: z.string(),
				price: z.string(),
				costPrice: z.string().optional(),
				totalQuota: z.number().min(0),
				refundPolicy: z.string(),
				refundDeadline: z.string().optional(),
				refundRate: z.string().optional(),
				transferAllowed: z.boolean().optional(),
				saleStartTime: z.string().optional(),
				saleEndTime: z.string().optional(),
				requiresSeat: z.boolean().optional(),
				seatZoneIds: z.array(z.string()).optional(),
				validationRules: z.record(z.any()).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = randomUUID();
			const [created] = await ctx.db.transaction(async (tx) => {
				const [c] = await tx
					.insert(ticketTypes)
					.values({
						id,
						eventId: input.eventId,
						code: input.code,
						name: input.name,
						description: input.description ?? null,
						category: input.category as TicketCategory,
						price: input.price,
						costPrice: input.costPrice ?? '0',
						totalQuota: input.totalQuota,
						refundPolicy: input.refundPolicy as any,
						refundDeadline: input.refundDeadline ? new Date(input.refundDeadline) : null,
						refundRate: input.refundRate ?? '0',
						transferAllowed: input.transferAllowed ?? false,
						saleStartTime: input.saleStartTime ? new Date(input.saleStartTime) : null,
						saleEndTime: input.saleEndTime ? new Date(input.saleEndTime) : null,
						requiresSeat: input.requiresSeat ?? true,
						seatZoneIds: input.seatZoneIds ?? null,
						validationRules: input.validationRules ?? null,
						status: 'active'
					} satisfies NewTicketType)
					.returning();

				await tx.insert(statusTransitions).values({
					id: randomUUID(),
					eventId: input.eventId,
					entityType: 'ticket_type' as any,
					entityId: id,
					fromStatus: null,
					toStatus: 'active',
					transitionType: 'ticket_type_created',
					operatorId: ctx.user.id,
					triggerSource: 'operator',
					remark: `创建票种: ${input.name} (${input.code})`
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
				price: z.string().optional(),
				costPrice: z.string().optional(),
				totalQuota: z.number().optional(),
				refundPolicy: z.string().optional(),
				transferAllowed: z.boolean().optional(),
				saleStartTime: z.string().optional(),
				saleEndTime: z.string().optional(),
				status: z.string().optional(),
				validationRules: z.record(z.any()).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const original = await ctx.db.query.ticketTypes.findFirst({ where: eq(ticketTypes.id, id) });
			if (!original) throw new Error('票种不存在');

			const [updated] = await ctx.db.transaction(async (tx) => {
				const [u] = await tx
					.update(ticketTypes)
					.set({
						...data,
						saleStartTime: data.saleStartTime ? new Date(data.saleStartTime) : original.saleStartTime,
						saleEndTime: data.saleEndTime ? new Date(data.saleEndTime) : original.saleEndTime,
						updatedAt: new Date()
					})
					.where(eq(ticketTypes.id, id))
					.returning();

				if (data.status && original.status !== data.status) {
					await tx.insert(statusTransitions).values({
						id: randomUUID(),
						eventId: original.eventId,
						entityType: 'ticket_type' as any,
						entityId: id,
						fromStatus: original.status,
						toStatus: data.status,
						transitionType: 'ticket_type_status_change',
						operatorId: ctx.user.id,
						triggerSource: 'operator',
						remark: `票种状态变更: ${original.status} → ${data.status}`
					});
				}

				return [u];
			});
			return updated;
		}),

	delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
		const original = await ctx.db.query.ticketTypes.findFirst({ where: eq(ticketTypes.id, input.id) });
		if (!original) throw new Error('票种不存在');
		await ctx.db.delete(ticketTypes).where(eq(ticketTypes.id, input.id));
		return { success: true };
	}),

	summary: protectedProcedure
		.input(z.object({ eventId: z.string() }))
		.query(async ({ ctx, input }) => {
			const types = await ctx.db
				.select({
					id: ticketTypes.id,
					name: ticketTypes.name,
					code: ticketTypes.code,
					category: ticketTypes.category,
					price: ticketTypes.price,
					totalQuota: ticketTypes.totalQuota,
					soldQuota: ticketTypes.soldQuota,
					heldQuota: ticketTypes.heldQuota
				})
				.from(ticketTypes)
				.where(eq(ticketTypes.eventId, input.eventId));

			return types.map((t) => ({
				...t,
				availableQuota: Math.max(0, t.totalQuota - t.soldQuota - t.heldQuota)
			}));
		})
});
