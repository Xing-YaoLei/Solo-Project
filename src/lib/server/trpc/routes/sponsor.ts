import { z } from 'zod';
import { router, protectedProcedure, operatorProcedure, adminProcedure } from '../trpc/trpc';
import { and, desc, eq, sql, sum, inArray } from 'drizzle-orm';
import {
	sponsors,
	sponsorTickets,
	verifications,
	statusTransitions,
	type NewSponsor,
	type NewSponsorTicket
} from '../db/schema';
import type {
	PaginationOutput,
	DateRangeFilter,
	SponsorLevel,
	SponsorStatus,
	VerificationSourceType
} from '$lib/shared/types';
import { randomUUID } from 'crypto';

export const sponsorRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(20),
				eventId: z.string().optional(),
				level: z.string().optional(),
				status: z.string().optional(),
				keyword: z.string().optional(),
				dateRange: z
					.object({ startDate: z.string().optional(), endDate: z.string().optional() })
					.optional()
			})
		)
		.query(async ({ ctx, input }): Promise<PaginationOutput<(typeof sponsors.$inferSelect)[]>> => {
			const { page, pageSize, eventId, level, status, keyword, dateRange } = input;
			const offset = (page - 1) * pageSize;

			const where = [];
			if (eventId) where.push(eq(sponsors.eventId, eventId));
			if (level) where.push(eq(sponsors.sponsorLevel, level as SponsorLevel));
			if (status) where.push(eq(sponsors.status, status as SponsorStatus));
			if (keyword) {
				where.push(
					sql`(${sponsors.name} ILIKE ${`%${keyword}%`} OR ${sponsors.contactPerson} ILIKE ${`%${keyword}%`} OR ${sponsors.contractNo} ILIKE ${`%${keyword}%`})`
				);
			}
			if (dateRange?.startDate) {
				where.push(sql`${sponsors.createdAt} >= ${dateRange.startDate}`);
			}
			if (dateRange?.endDate) {
				where.push(sql`${sponsors.createdAt} <= ${dateRange.endDate}`);
			}

			const [items, countResult] = await Promise.all([
				ctx.db
					.select()
					.from(sponsors)
					.where(where.length ? and(...where) : undefined)
					.orderBy(desc(sponsors.createdAt))
					.limit(pageSize)
					.offset(offset),
				ctx.db
					.select({ count: sql<number>`count(*)` })
					.from(sponsors)
					.where(where.length ? and(...where) : undefined)
			]);

			const total = countResult[0]?.count ?? 0;

			return {
				items,
				total,
				page,
				pageSize,
				totalPages: Math.ceil(total / pageSize)
			};
		}),

	get: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const [sponsor, tickets] = await Promise.all([
				ctx.db.query.sponsors.findFirst({ where: eq(sponsors.id, input.id) }),
				ctx.db
					.select()
					.from(sponsorTickets)
					.where(eq(sponsorTickets.sponsorId, input.id))
					.orderBy(desc(sponsorTickets.createdAt))
			]);
			return { sponsor, tickets };
		}),

	create: operatorProcedure
		.input(
			z.object({
				eventId: z.string(),
				name: z.string().min(1),
				contactPerson: z.string().optional(),
				contactPhone: z.string().optional(),
				contactEmail: z.string().optional(),
				sponsorLevel: z.string(),
				totalTickets: z.number().optional(),
				totalAmount: z.string().optional(),
				contractNo: z.string().optional(),
				notes: z.string().optional(),
				tickets: z.array(
					z.object({
						ticketTypeId: z.string().optional(),
						quantity: z.number().min(1),
						unitValue: z.string().optional(),
						deliveredDate: z.string().optional(),
						deliveryNotes: z.string().optional()
					})
				).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const sponsorId = randomUUID();

			const result = await ctx.db.transaction(async (tx) => {
				const [sponsor] = await tx
					.insert(sponsors)
					.values({
						id: sponsorId,
						eventId: input.eventId,
						name: input.name,
						contactPerson: input.contactPerson ?? null,
						contactPhone: input.contactPhone ?? null,
						contactEmail: input.contactEmail ?? null,
						sponsorLevel: input.sponsorLevel as SponsorLevel,
						totalTickets: input.totalTickets ?? 0,
						totalAmount: input.totalAmount ?? '0',
						contractNo: input.contractNo ?? null,
						notes: input.notes ?? null,
						status: 'pending'
					} satisfies NewSponsor)
					.returning();

				let insertedTickets: (typeof sponsorTickets.$inferSelect)[] = [];
				if (input.tickets && input.tickets.length > 0) {
					insertedTickets = await tx
						.insert(sponsorTickets)
						.values(
							input.tickets.map((t) => ({
								id: randomUUID(),
								sponsorId,
								ticketTypeId: t.ticketTypeId ?? null,
								quantity: t.quantity,
								unitValue: t.unitValue ?? '0',
								deliveredDate: t.deliveredDate ? new Date(t.deliveredDate) : null,
								deliveryNotes: t.deliveryNotes ?? null,
								receivedBy: ctx.user?.id ?? null
							}))
						)
						.returning();
				}

				await tx.insert(statusTransitions).values({
					id: randomUUID(),
					eventId: input.eventId,
					entityType: 'dispute' as any,
					entityId: sponsorId,
					fromStatus: null,
					toStatus: 'pending',
					transitionType: 'sponsor_created',
					operatorId: ctx.user.id,
					triggerSource: 'operator',
					remark: `创建赞助单: ${input.name}`
				});

				return { sponsor, tickets: insertedTickets };
			});

			return result;
		}),

	update: operatorProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).optional(),
				contactPerson: z.string().optional(),
				contactPhone: z.string().optional(),
				contactEmail: z.string().optional(),
				sponsorLevel: z.string().optional(),
				totalTickets: z.number().optional(),
				totalAmount: z.string().optional(),
				contractNo: z.string().optional(),
				notes: z.string().optional(),
				status: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const original = await ctx.db.query.sponsors.findFirst({ where: eq(sponsors.id, id) });

			const [updated] = await ctx.db
				.update(sponsors)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(sponsors.id, id))
				.returning();

			if (data.status && original && original.status !== data.status) {
				await ctx.db.insert(statusTransitions).values({
					id: randomUUID(),
					eventId: updated.eventId,
					entityType: 'dispute' as any,
					entityId: id,
					fromStatus: original.status,
					toStatus: data.status,
					transitionType: 'sponsor_status_change',
					operatorId: ctx.user.id,
					triggerSource: 'operator',
					remark: `状态从 ${original.status} 变更为 ${data.status}`
				});
			}

			return updated;
		}),

	addTicket: operatorProcedure
		.input(
			z.object({
				sponsorId: z.string(),
				ticketTypeId: z.string().optional(),
				quantity: z.number().min(1),
				unitValue: z.string().optional(),
				deliveredDate: z.string().optional(),
				deliveryNotes: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [st] = await ctx.db
				.insert(sponsorTickets)
				.values({
					id: randomUUID(),
					sponsorId: input.sponsorId,
					ticketTypeId: input.ticketTypeId ?? null,
					quantity: input.quantity,
					unitValue: input.unitValue ?? '0',
					deliveredDate: input.deliveredDate ? new Date(input.deliveredDate) : null,
					deliveryNotes: input.deliveryNotes ?? null,
					receivedBy: ctx.user.id
				} satisfies NewSponsorTicket)
				.returning();
			return st;
		}),

	generateVerificationCodes: operatorProcedure
		.input(
			z.object({
				sponsorId: z.string(),
				sponsorTicketId: z.string().optional(),
				eventId: z.string(),
				count: z.number().min(1).max(500)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { sponsorId, sponsorTicketId, eventId, count } = input;

			const generatedCodes = await ctx.db.transaction(async (tx) => {
				const codes: (typeof verifications.$inferSelect)[] = [];
				for (let i = 0; i < count; i++) {
					const serial = `SP-${Date.now().toString().slice(-6)}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
					const [vc] = await tx
						.insert(verifications)
						.values({
							id: randomUUID(),
							eventId,
							sourceType: 'sponsor' as VerificationSourceType,
							sourceId: sponsorTicketId ?? sponsorId,
							serialNumber: serial,
							status: 'issued',
							notes: `赞助票 ${sponsorId}`
						})
						.returning();
					codes.push(vc);
				}

				await tx.insert(statusTransitions).values({
					id: randomUUID(),
					eventId,
					entityType: 'verification' as any,
					entityId: sponsorId,
					fromStatus: null,
					toStatus: 'issued',
					transitionType: 'sponsor_tickets_generated',
					operatorId: ctx.user.id,
					triggerSource: 'operator',
					metadata: { count },
					remark: `生成 ${count} 张赞助核销码`
				});

				return codes;
			});

			return generatedCodes;
		}),

	statistics: protectedProcedure
		.input(z.object({ eventId: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			const where = input.eventId ? eq(sponsors.eventId, input.eventId) : undefined;
			const [aggStats] = await ctx.db
				.select({
					totalSponsors: sql<number>`count(distinct ${sponsors.id})`,
					totalTickets: sum(sponsors.totalTickets).mapWith(String),
					totalAmount: sum(sponsors.totalAmount).mapWith(String)
				})
				.from(sponsors)
				.where(where);

			const byLevel = await ctx.db
				.select({
					level: sponsors.sponsorLevel,
					count: sql<number>`count(*)`,
					tickets: sum(sponsors.totalTickets).mapWith(String),
					amount: sum(sponsors.totalAmount).mapWith(String)
				})
				.from(sponsors)
				.where(where)
				.groupBy(sponsors.sponsorLevel);

			return {
				aggregated: aggStats,
				byLevel
			};
		})
});
