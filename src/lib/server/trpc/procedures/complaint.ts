import { router, authedProcedure, createPermissionGuard } from '$server/trpc/context';
import { z } from 'zod';
import { db } from '$server/db';
import { complaints, users, tags, complaintTags, attachments, escalationRecords, callbackResults, processingLogs, reassignmentRecords } from '$server/db/schema';
import { eq, and, desc, sql, count, lt } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { maskComplaint } from '$lib/utils/permissions';

const complaintGuard = (code: string) => authedProcedure.use(createPermissionGuard([code]));

export const complaintRouter = router({
	list: authedProcedure
		.input(z.object({
			status: z.string().optional(),
			tagCode: z.string().optional(),
			assigneeId: z.string().optional(),
			visitorId: z.string().optional(),
			isOverdue: z.boolean().optional(),
			page: z.number().default(1),
			pageSize: z.number().default(20)
		}))
		.query(async ({ ctx, input }) => {
			const { status, tagCode, assigneeId, visitorId, isOverdue, page, pageSize } = input;

			if (ctx.user.roleName === 'visitor') {
				const conditions = [eq(complaints.visitorId, ctx.user.id)];
				if (status) conditions.push(eq(complaints.status, status));
				if (isOverdue !== undefined) conditions.push(eq(complaints.isOverdue, isOverdue));

				const where = and(...conditions);

				const [countResult] = await db
					.select({ total: count() })
					.from(complaints)
					.where(where);

				const items = await db
					.select()
					.from(complaints)
					.where(where)
					.orderBy(desc(complaints.createdAt))
					.limit(pageSize)
					.offset((page - 1) * pageSize);

				return {
					items: items.map((c) => maskComplaint(c, ctx.user.roleName)),
					total: countResult?.total ?? 0,
					page,
					pageSize
				};
			}

			const conditions = [];
			if (status) conditions.push(eq(complaints.status, status));
			if (assigneeId) conditions.push(eq(complaints.assigneeId, assigneeId));
			if (visitorId) conditions.push(eq(complaints.visitorId, visitorId));
			if (isOverdue !== undefined) conditions.push(eq(complaints.isOverdue, isOverdue));

			if (tagCode) {
				const tagSubquery = db
					.select({ complaintId: complaintTags.complaintId })
					.from(complaintTags)
					.innerJoin(tags, eq(complaintTags.tagId, tags.id))
					.where(eq(tags.code, tagCode));

				conditions.push(sql`${complaints.id} IN ${tagSubquery}`);
			}

			const where = conditions.length > 0 ? and(...conditions) : undefined;

			const [countResult] = await db
				.select({ total: count() })
				.from(complaints)
				.where(where);

			const complaintRows = await db
				.select()
				.from(complaints)
				.where(where)
				.orderBy(desc(complaints.createdAt))
				.limit(pageSize)
				.offset((page - 1) * pageSize);

			const complaintIds = complaintRows.map((c) => c.id);

			if (complaintIds.length === 0) {
				return { items: [], total: countResult?.total ?? 0, page, pageSize };
			}

			const visitorRows = await db
				.select({ id: users.id, displayName: users.displayName, phone: users.phone })
				.from(users)
				.where(sql`${users.id} IN ${complaintRows.map((c) => c.visitorId)}`);

			const assigneeRows = await db
				.select({ id: users.id, displayName: users.displayName, phone: users.phone })
				.from(users)
				.where(sql`${users.id} IN ${complaintRows.filter((c) => c.assigneeId).map((c) => c.assigneeId)}`);

			const tagRows = await db
				.select({ complaintId: complaintTags.complaintId, id: tags.id, code: tags.code, label: tags.label, category: tags.category })
				.from(complaintTags)
				.innerJoin(tags, eq(complaintTags.tagId, tags.id))
				.where(sql`${complaintTags.complaintId} IN ${complaintIds}`);

			const visitorMap = new Map(visitorRows.map((v) => [v.id, v]));
			const assigneeMap = new Map(assigneeRows.map((a) => [a.id, a]));
			const tagMap = new Map<string, { id: string; code: string; label: string; category: string }[]>();
			for (const t of tagRows) {
				if (!tagMap.has(t.complaintId)) tagMap.set(t.complaintId, []);
				tagMap.get(t.complaintId)!.push({ id: t.id, code: t.code, label: t.label, category: t.category });
			}

			const items = complaintRows.map((c) => {
				const visitor = visitorMap.get(c.visitorId);
				const assignee = c.assigneeId ? assigneeMap.get(c.assigneeId) : null;
				return maskComplaint({
					...c,
					visitorName: visitor?.displayName ?? null,
					visitorPhone: visitor?.phone ?? null,
					assigneeName: assignee?.displayName ?? null,
					assigneePhone: assignee?.phone ?? null,
					tags: tagMap.get(c.id) ?? []
				}, ctx.user.roleName);
			});

			return { items, total: countResult?.total ?? 0, page, pageSize };
		}),

	get: authedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const [complaint] = await db
				.select()
				.from(complaints)
				.where(eq(complaints.id, input.id));

			if (!complaint) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '投诉不存在' });
			}

			if (ctx.user.roleName === 'visitor' && complaint.visitorId !== ctx.user.id) {
				throw new TRPCError({ code: 'FORBIDDEN', message: '无权查看此投诉' });
			}

			const [visitor] = await db
				.select({ id: users.id, displayName: users.displayName, phone: users.phone })
				.from(users)
				.where(eq(users.id, complaint.visitorId));

			let assignee: { id: string; displayName: string; phone: string | null } | null = null;
			if (complaint.assigneeId) {
				const [row] = await db
					.select({ id: users.id, displayName: users.displayName, phone: users.phone })
					.from(users)
					.where(eq(users.id, complaint.assigneeId));
				assignee = row ?? null;
			}

			const complaintTagRows = await db
				.select({ id: tags.id, code: tags.code, label: tags.label, category: tags.category })
				.from(complaintTags)
				.innerJoin(tags, eq(complaintTags.tagId, tags.id))
				.where(eq(complaintTags.complaintId, complaint.id));

			const attachmentRows = await db
				.select()
				.from(attachments)
				.where(eq(attachments.complaintId, complaint.id));

			const escalationRows = await db
				.select()
				.from(escalationRecords)
				.where(eq(escalationRecords.complaintId, complaint.id));

			const callbackRows = await db
				.select()
				.from(callbackResults)
				.where(eq(callbackResults.complaintId, complaint.id));

			const logRows = await db
				.select()
				.from(processingLogs)
				.where(eq(processingLogs.complaintId, complaint.id));

			return maskComplaint({
				...complaint,
				visitorName: visitor?.displayName ?? null,
				visitorPhone: visitor?.phone ?? null,
				assigneeName: assignee?.displayName ?? null,
				assigneePhone: assignee?.phone ?? null,
				tags: complaintTagRows,
				attachmentList: attachmentRows,
				escalationRecords: escalationRows,
				callbackResults: callbackRows,
				processingLogs: logRows
			}, ctx.user.roleName);
		}),

	create: complaintGuard('complaint:create')
		.input(z.object({
			description: z.string(),
			tagIds: z.array(z.string()).optional().default([]),
			deadline: z.string().optional(),
			attachments: z.array(z.object({
				fileName: z.string(),
				fileUrl: z.string(),
				fileType: z.string()
			})).optional()
		}))
		.mutation(async ({ ctx, input }) => {
			const [created] = await db.insert(complaints).values({
				visitorId: ctx.user.id,
				description: input.description,
				status: 'pending',
				deadline: input.deadline ? new Date(input.deadline) : null
			}).returning();

			if (input.tagIds && input.tagIds.length > 0) {
				await db.insert(complaintTags).values(
					input.tagIds.map((tagId) => ({
						complaintId: created.id,
						tagId
					}))
				);
			}

			if (input.attachments && input.attachments.length > 0) {
				await db.insert(attachments).values(
					input.attachments.map((att) => ({
						complaintId: created.id,
						fileName: att.fileName,
						fileUrl: att.fileUrl,
						fileType: att.fileType,
						uploadedBy: ctx.user.id
					}))
				);
			}

			await db.insert(processingLogs).values({
				complaintId: created.id,
				action: 'created',
				operatorId: ctx.user.id
			});

			return created;
		}),

	assign: complaintGuard('complaint:assign')
		.input(z.object({
			complaintId: z.string(),
			assigneeId: z.string()
		}))
		.mutation(async ({ ctx, input }) => {
			const [updated] = await db
				.update(complaints)
				.set({ assigneeId: input.assigneeId, status: 'assigned', updatedAt: new Date() })
				.where(eq(complaints.id, input.complaintId))
				.returning();

			if (!updated) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '投诉不存在' });
			}

			await db.insert(processingLogs).values({
				complaintId: input.complaintId,
				action: 'assigned',
				operatorId: ctx.user.id
			});

			return updated;
		}),

	startProgress: complaintGuard('complaint:assign')
		.input(z.object({ complaintId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const [updated] = await db
				.update(complaints)
				.set({ status: 'in_progress', updatedAt: new Date() })
				.where(eq(complaints.id, input.complaintId))
				.returning();

			if (!updated) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '投诉不存在' });
			}

			await db.insert(processingLogs).values({
				complaintId: input.complaintId,
				action: 'in_progress',
				operatorId: ctx.user.id
			});

			return updated;
		}),

	resolve: complaintGuard('complaint:close')
		.input(z.object({ complaintId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const [updated] = await db
				.update(complaints)
				.set({ status: 'resolved', closedAt: new Date(), updatedAt: new Date() })
				.where(eq(complaints.id, input.complaintId))
				.returning();

			if (!updated) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '投诉不存在' });
			}

			await db.insert(processingLogs).values({
				complaintId: input.complaintId,
				action: 'resolved',
				operatorId: ctx.user.id
			});

			return updated;
		}),

	close: complaintGuard('complaint:close')
		.input(z.object({ complaintId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const [updated] = await db
				.update(complaints)
				.set({ status: 'closed', closedAt: new Date(), updatedAt: new Date() })
				.where(eq(complaints.id, input.complaintId))
				.returning();

			if (!updated) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '投诉不存在' });
			}

			await db.insert(processingLogs).values({
				complaintId: input.complaintId,
				action: 'closed',
				operatorId: ctx.user.id
			});

			return updated;
		}),

	escalate: complaintGuard('complaint:escalate')
		.input(z.object({
			complaintId: z.string(),
			toUserId: z.string(),
			reason: z.string()
		}))
		.mutation(async ({ ctx, input }) => {
			const [complaint] = await db
				.select()
				.from(complaints)
				.where(eq(complaints.id, input.complaintId));

			if (!complaint) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '投诉不存在' });
			}

			await db
				.update(complaints)
				.set({ status: 'escalated', updatedAt: new Date() })
				.where(eq(complaints.id, input.complaintId));

			await db.insert(escalationRecords).values({
				complaintId: input.complaintId,
				fromUserId: ctx.user.id,
				toUserId: input.toUserId,
				reason: input.reason
			});

			await db.insert(processingLogs).values({
				complaintId: input.complaintId,
				action: 'escalated',
				operatorId: ctx.user.id
			});

			return { success: true };
		}),

	supplement: complaintGuard('complaint:supplement')
		.input(z.object({
			complaintId: z.string(),
			note: z.string()
		}))
		.mutation(async ({ ctx, input }) => {
			await db.insert(processingLogs).values({
				complaintId: input.complaintId,
				action: 'supplemented',
				operatorId: ctx.user.id,
				detail: { note: input.note }
			});

			return { success: true };
		}),

	reject: complaintGuard('complaint:reject')
		.input(z.object({
			complaintId: z.string(),
			reason: z.string()
		}))
		.mutation(async ({ ctx, input }) => {
			const [updated] = await db
				.update(complaints)
				.set({ status: 'rejected', updatedAt: new Date() })
				.where(eq(complaints.id, input.complaintId))
				.returning();

			if (!updated) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '投诉不存在' });
			}

			await db.insert(processingLogs).values({
				complaintId: input.complaintId,
				action: 'rejected',
				operatorId: ctx.user.id,
				detail: { reason: input.reason }
			});

			return updated;
		}),

	resubmit: complaintGuard('complaint:resubmit')
		.input(z.object({
			complaintId: z.string(),
			supplementInfo: z.string()
		}))
		.mutation(async ({ ctx, input }) => {
			const [updated] = await db
				.update(complaints)
				.set({ status: 'resubmitted', updatedAt: new Date() })
				.where(eq(complaints.id, input.complaintId))
				.returning();

			if (!updated) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '投诉不存在' });
			}

			await db.insert(processingLogs).values({
				complaintId: input.complaintId,
				action: 'resubmitted',
				operatorId: ctx.user.id,
				detail: { supplementInfo: input.supplementInfo }
			});

			return updated;
		}),

	reassign: complaintGuard('complaint:reassign')
		.input(z.object({
			complaintId: z.string(),
			toAssigneeId: z.string(),
			reason: z.string()
		}))
		.mutation(async ({ ctx, input }) => {
			const [complaint] = await db
				.select()
				.from(complaints)
				.where(eq(complaints.id, input.complaintId));

			if (!complaint) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '投诉不存在' });
			}

			await db
				.update(complaints)
				.set({ assigneeId: input.toAssigneeId, updatedAt: new Date() })
				.where(eq(complaints.id, input.complaintId));

			await db.insert(reassignmentRecords).values({
				complaintId: input.complaintId,
				fromAssigneeId: complaint.assigneeId,
				toAssigneeId: input.toAssigneeId,
				reason: input.reason,
				operatorId: ctx.user.id
			});

			await db.insert(processingLogs).values({
				complaintId: input.complaintId,
				action: 'reassigned',
				operatorId: ctx.user.id
			});

			return { success: true };
		}),

	checkOverdue: complaintGuard('complaint:close')
		.mutation(async ({ ctx }) => {
			const overdueComplaints = await db
				.select({ id: complaints.id })
				.from(complaints)
				.where(
					and(
						lt(complaints.deadline, new Date()),
						sql`${complaints.status} NOT IN ('closed', 'resolved')`,
						eq(complaints.isOverdue, false)
					)
				);

			if (overdueComplaints.length === 0) {
				return { count: 0 };
			}

			for (const c of overdueComplaints) {
				await db
					.update(complaints)
					.set({ isOverdue: true, updatedAt: new Date() })
					.where(eq(complaints.id, c.id));

				await db.insert(processingLogs).values({
					complaintId: c.id,
					action: 'overdue_entered',
					operatorId: ctx.user.id
				});
			}

			return { count: overdueComplaints.length };
		}),

	overdueList: authedProcedure
		.input(z.object({
			page: z.number().default(1),
			pageSize: z.number().default(20)
		}))
		.query(async ({ ctx, input }) => {
			const { page, pageSize } = input;

			const where = and(
				eq(complaints.isOverdue, true),
				sql`${complaints.status} NOT IN ('closed', 'resolved')`
			);

			const [countResult] = await db
				.select({ total: count() })
				.from(complaints)
				.where(where);

			const complaintRows = await db
				.select()
				.from(complaints)
				.where(where)
				.orderBy(desc(complaints.createdAt))
				.limit(pageSize)
				.offset((page - 1) * pageSize);

			const assigneeIds = Array.from(new Set(complaintRows.filter((c) => c.assigneeId).map((c) => c.assigneeId!)));

			const assigneeMap = new Map<string, { displayName: string; phone: string | null }>();
			if (assigneeIds.length > 0) {
				const assigneeRows = await db
					.select({ id: users.id, displayName: users.displayName, phone: users.phone })
					.from(users)
					.where(sql`${users.id} IN ${assigneeIds}`);
				for (const a of assigneeRows) {
					assigneeMap.set(a.id, { displayName: a.displayName, phone: a.phone });
				}
			}

			const items = complaintRows.map((c) => {
				const assignee = c.assigneeId ? assigneeMap.get(c.assigneeId) : null;
				return maskComplaint({
					...c,
					assigneeName: assignee?.displayName ?? null,
					assigneePhone: assignee?.phone ?? null
				}, ctx.user.roleName);
			});

			return { items, total: countResult?.total ?? 0, page, pageSize };
		})
});
