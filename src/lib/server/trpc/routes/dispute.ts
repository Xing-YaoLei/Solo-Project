import { z } from 'zod';
import { router, protectedProcedure, operatorProcedure, financeProcedure, adminProcedure } from '../trpc/trpc';
import { and, desc, eq, sql, count, isNull, not } from 'drizzle-orm';
import {
	disputeTickets,
	disputeMessages,
	statusTransitions,
	orders,
	orderItems,
	verifications,
	users,
	type NewDisputeTicket,
	type NewDisputeMessage
} from '../db/schema';
import type {
	PaginationOutput,
	DisputeType,
	DisputeSeverity,
	ResponsibleParty,
	DisputeStatus,
	DisputeResolution,
	ImpactScope
} from '$lib/shared/types';
import { randomUUID } from 'crypto';

export const disputeRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(20),
				eventId: z.string().optional(),
				type: z.string().optional(),
				status: z.string().optional(),
				severity: z.string().optional(),
				partyResponsible: z.string().optional(),
				caseNo: z.string().optional(),
				title: z.string().optional(),
				assignedTo: z.string().optional(),
				dateRange: z.object({ startDate: z.string().optional(), endDate: z.string().optional() }).optional()
			})
		)
		.query(async ({ ctx, input }): Promise<PaginationOutput<(typeof disputeTickets.$inferSelect)[]>> => {
			const { page, pageSize, eventId, type, status, severity, partyResponsible, caseNo, title, assignedTo, dateRange } =
				input;
			const offset = (page - 1) * pageSize;

			const where = [];
			if (eventId) where.push(eq(disputeTickets.eventId, eventId));
			if (type) where.push(eq(disputeTickets.type, type as DisputeType));
			if (status) where.push(eq(disputeTickets.status, status as DisputeStatus));
			if (severity) where.push(eq(disputeTickets.severity, severity as DisputeSeverity));
			if (partyResponsible)
				where.push(eq(disputeTickets.partyResponsible, partyResponsible as ResponsibleParty));
			if (caseNo) where.push(sql`${disputeTickets.caseNo} ILIKE ${`%${caseNo}%`}`);
			if (title) where.push(sql`${disputeTickets.title} ILIKE ${`%${title}%`}`);
			if (assignedTo) where.push(eq(disputeTickets.assignedTo, assignedTo));
			if (dateRange?.startDate) where.push(sql`${disputeTickets.createdAt} >= ${dateRange.startDate}`);
			if (dateRange?.endDate) where.push(sql`${disputeTickets.createdAt} <= ${dateRange.endDate}`);

			const [items, countResult] = await Promise.all([
				ctx.db
					.select()
					.from(disputeTickets)
					.where(where.length ? and(...where) : undefined)
					.orderBy(desc(disputeTickets.createdAt))
					.limit(pageSize)
					.offset(offset),
				ctx.db
					.select({ count: sql<number>`count(*)` })
					.from(disputeTickets)
					.where(where.length ? and(...where) : undefined)
			]);

			const total = countResult[0]?.count ?? 0;
			return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
		}),

	get: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const [dispute, messages, transitions] = await Promise.all([
				ctx.db.query.disputeTickets.findFirst({ where: eq(disputeTickets.id, input.id) }),
				ctx.db
					.select({
						message: disputeMessages,
						senderName: users.displayName,
						senderUsername: users.username
					})
					.from(disputeMessages)
					.leftJoin(users, eq(disputeMessages.senderId, users.id))
					.where(eq(disputeMessages.disputeTicketId, input.id))
					.orderBy(desc(disputeMessages.createdAt)),
				ctx.db
					.select()
					.from(statusTransitions)
					.where(
						and(eq(statusTransitions.entityType, 'dispute'), eq(statusTransitions.entityId, input.id))
					)
					.orderBy(desc(statusTransitions.createdAt))
			]);

			let relatedData: { order?: any; orderItems?: any[]; verifications?: any[] } = {};
			if (dispute?.relatedOrderId) {
				const [ord, ordItems, verif] = await Promise.all([
					ctx.db.query.orders.findFirst({ where: eq(orders.id, dispute.relatedOrderId) }),
					ctx.db.select().from(orderItems).where(eq(orderItems.orderId, dispute.relatedOrderId)),
					dispute.relatedVerificationId
						? ctx.db.query.verifications.findFirst({
								where: eq(verifications.id, dispute.relatedVerificationId)
							})
						: null
				]);
				relatedData = { order: ord, orderItems: ordItems, verifications: verif ? [verif] : [] };
			}

			return { dispute, messages, transitions, relatedData };
		}),

	create: operatorProcedure
		.input(
			z.object({
				eventId: z.string(),
				type: z.string(),
				sourceType: z.string().optional(),
				relatedOrderId: z.string().optional(),
				relatedVerificationId: z.string().optional(),
				relatedOrderItemIds: z.array(z.string()).optional(),
				title: z.string().min(1),
				description: z.string().optional(),
				severity: z.string().optional(),
				impactScope: z
					.object({
						orderCount: z.number().optional(),
						ticketCount: z.number().optional(),
						involvedAmount: z.string().optional(),
						affectedUsers: z.array(z.string()).optional(),
						timeRange: z
							.object({ start: z.string().optional(), end: z.string().optional() })
							.optional(),
						seats: z.array(z.string()).optional()
					})
					.optional(),
				partyResponsible: z.string().optional(),
				responsibilityDetail: z.string().optional(),
				evidenceUrls: z.array(z.string()).optional(),
				assignedTo: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = randomUUID();
			const caseNo = `DSP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

			const [created] = await ctx.db.transaction(async (tx) => {
				const [c] = await tx
					.insert(disputeTickets)
					.values({
						id,
						eventId: input.eventId,
						caseNo,
						type: input.type as DisputeType,
						sourceType: (input.sourceType ?? 'operator_report') as any,
						relatedOrderId: input.relatedOrderId ?? null,
						relatedVerificationId: input.relatedVerificationId ?? null,
						relatedOrderItemIds: input.relatedOrderItemIds ?? null,
						title: input.title,
						description: input.description ?? null,
						severity: (input.severity ?? 'medium') as DisputeSeverity,
						impactScope: (input.impactScope as ImpactScope) ?? null,
						partyResponsible: (input.partyResponsible ?? 'undetermined') as ResponsibleParty,
						responsibilityDetail: input.responsibilityDetail ?? null,
						evidenceUrls: input.evidenceUrls ?? null,
						status: 'open' as DisputeStatus,
						assignedTo: input.assignedTo ?? null,
						reportedBy: ctx.user.id,
						reportedAt: new Date()
					} satisfies NewDisputeTicket)
					.returning();

				await tx.insert(statusTransitions).values({
					id: randomUUID(),
					eventId: input.eventId,
					entityType: 'dispute' as any,
					entityId: id,
					fromStatus: null,
					toStatus: 'open',
					transitionType: 'dispute_created',
					operatorId: ctx.user.id,
					triggerSource: 'operator',
					remark: `创建异常单 ${caseNo}: ${input.title}`
				});

				return [c];
			});

			return created;
		}),

	updateStatus: operatorProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.string(),
				resolution: z.string().optional(),
				resolutionDetail: z.string().optional(),
				refundAmount: z.string().optional(),
				compensationAmount: z.string().optional(),
				approverId: z.string().optional(),
				reason: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const original = await ctx.db.query.disputeTickets.findFirst({
				where: eq(disputeTickets.id, input.id)
			});
			if (!original) throw new Error('异常单不存在');

			const [updated] = await ctx.db.transaction(async (tx) => {
				const now = new Date();
				const [u] = await tx
					.update(disputeTickets)
					.set({
						status: input.status as DisputeStatus,
						resolution: input.resolution ? (input.resolution as DisputeResolution) : original.resolution,
						resolutionDetail: input.resolutionDetail ?? original.resolutionDetail,
						refundAmount: input.refundAmount ?? original.refundAmount,
						compensationAmount: input.compensationAmount ?? original.compensationAmount,
						approverId: input.approverId ?? original.approverId,
						approvedAt: input.status === 'pending_approval' ? now : original.approvedAt,
						resolvedAt: input.status === 'resolved' ? now : original.resolvedAt,
						closedAt: input.status === 'closed' ? now : original.closedAt,
						updatedAt: now
					})
					.where(eq(disputeTickets.id, input.id))
					.returning();

				await tx.insert(statusTransitions).values({
					id: randomUUID(),
					eventId: original.eventId,
					entityType: 'dispute' as any,
					entityId: input.id,
					fromStatus: original.status,
					toStatus: input.status,
					transitionType: 'dispute_status_change',
					operatorId: ctx.user.id,
					triggerSource: 'operator',
					metadata: {
						resolution: input.resolution,
						refundAmount: input.refundAmount,
						compensationAmount: input.compensationAmount
					},
					remark:
						input.reason ??
						`状态变更: ${original.status} → ${input.status}${input.resolution ? `，处理方式: ${input.resolution}` : ''}`
				});

				return [u];
			});

			return updated;
		}),

	updateImpact: operatorProcedure
		.input(
			z.object({
				id: z.string(),
				impactScope: z.object({
					orderCount: z.number().optional(),
					ticketCount: z.number().optional(),
					involvedAmount: z.string().optional(),
					affectedUsers: z.array(z.string()).optional(),
					timeRange: z
						.object({ start: z.string().optional(), end: z.string().optional() })
						.optional(),
					seats: z.array(z.string()).optional()
				}),
				partyResponsible: z.string().optional(),
				responsibilityDetail: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const [updated] = await ctx.db
				.update(disputeTickets)
				.set({
					impactScope: data.impactScope as ImpactScope,
					partyResponsible: data.partyResponsible
						? (data.partyResponsible as ResponsibleParty)
						: undefined,
					responsibilityDetail: data.responsibilityDetail,
					updatedAt: new Date()
				})
				.where(eq(disputeTickets.id, id))
				.returning();
			return updated;
		}),

	addMessage: protectedProcedure
		.input(
			z.object({
				disputeTicketId: z.string(),
				content: z.string().min(1),
				attachments: z.array(z.string()).optional(),
				isInternal: z.boolean().optional(),
				senderType: z.enum(['staff', 'system', 'customer']).default('staff')
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [msg] = await ctx.db
				.insert(disputeMessages)
				.values({
					id: randomUUID(),
					disputeTicketId: input.disputeTicketId,
					senderId: ctx.user.id,
					senderType: input.senderType,
					content: input.content,
					attachments: input.attachments ?? null,
					isInternal: input.isInternal ?? true
				} satisfies NewDisputeMessage)
				.returning();
			return msg;
		}),

	assign: adminProcedure
		.input(
			z.object({
				id: z.string(),
				assignedTo: z.string()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.update(disputeTickets)
				.set({ assignedTo: input.assignedTo, updatedAt: new Date() })
				.where(eq(disputeTickets.id, input.id))
				.returning();
			return updated;
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
			if (input.eventId) where.push(eq(disputeTickets.eventId, input.eventId));
			if (input.dateRange?.startDate) where.push(sql`${disputeTickets.createdAt} >= ${input.dateRange.startDate}`);
			if (input.dateRange?.endDate) where.push(sql`${disputeTickets.createdAt} <= ${input.dateRange.endDate}`);
			const wc = where.length ? and(...where) : undefined;

			const [overview] = await ctx.db
				.select({
					total: sql<number>`count(*)`,
					open: sql<number>`sum(case when ${disputeTickets.status} = 'open' then 1 else 0 end)`,
					investigating: sql<number>`sum(case when ${disputeTickets.status} = 'investigating' then 1 else 0 end)`,
					resolved: sql<number>`sum(case when ${disputeTickets.status} = 'resolved' or ${disputeTickets.status} = 'closed' then 1 else 0 end)`,
					critical: sql<number>`sum(case when ${disputeTickets.severity} = 'critical' then 1 else 0 end)`,
					high: sql<number>`sum(case when ${disputeTickets.severity} = 'high' then 1 else 0 end)`
				})
				.from(disputeTickets)
				.where(wc);

			const byType = await ctx.db
				.select({
					type: disputeTickets.type,
					count: count()
				})
				.from(disputeTickets)
				.where(wc)
				.groupBy(disputeTickets.type);

			const byParty = await ctx.db
				.select({
					party: disputeTickets.partyResponsible,
					count: count()
				})
				.from(disputeTickets)
				.where(wc)
				.where(not(isNull(disputeTickets.partyResponsible)))
				.groupBy(disputeTickets.partyResponsible);

			return { overview, byType, byParty };
		})
});
