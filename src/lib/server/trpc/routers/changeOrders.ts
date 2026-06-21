import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '$lib/server/db';
import {
	changeOrders,
	flowRecords,
	attachments,
	notes,
	documentTypeEnum,
	statusEnum,
	type ChangeOrder,
	type FlowRecord,
	type Attachment,
	type Note
} from '$lib/server/db/schema';
import { eq, desc, ilike, and, or, type SQL, asc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

type ChangeOrderWithDetails = ChangeOrder & {
	attachments: Attachment[];
	notes: Note[];
	flowRecords: FlowRecord[];
};

export const changeOrdersRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(20),
				projectId: z.string().uuid().optional(),
				status: z.enum(['draft', 'pending', 'processing', 'approved', 'rejected', 'completed', 'cancelled']).optional(),
				search: z.string().optional()
			})
		)
		.query(async ({ input }) => {
			const where: SQL<unknown>[] = [];
			if (input.projectId) {
				where.push(eq(changeOrders.projectId, input.projectId));
			}
			if (input.status) {
				where.push(eq(changeOrders.status, input.status));
			}
			if (input.search) {
				where.push(
					or(
						ilike(changeOrders.code, `%${input.search}%`),
						ilike(changeOrders.title, `%${input.search}%`),
						ilike(changeOrders.description, `%${input.search}%`)
					) as SQL<unknown>
				);
			}

			const data = await db
				.select()
				.from(changeOrders)
				.where(where.length > 0 ? and(...where) : undefined)
				.orderBy(desc(changeOrders.createdAt))
				.limit(input.pageSize)
				.offset((input.page - 1) * input.pageSize);

			const total = await db.$count(changeOrders, where.length > 0 ? and(...where) : undefined);

			return { data, total, page: input.page, pageSize: input.pageSize };
		}),

	get: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ input }) => {
			const [changeOrder] = await db
				.select()
				.from(changeOrders)
				.where(eq(changeOrders.id, input.id))
				.limit(1);

			if (!changeOrder) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '变更单不存在' });
			}

			const [attachmentList, noteList, flowRecordList] = await Promise.all([
				db
					.select()
					.from(attachments)
					.where(
						and(
							eq(attachments.documentId, input.id),
							eq(attachments.documentType, 'change_order')
						)
					)
					.orderBy(asc(attachments.createdAt)),
				db
					.select()
					.from(notes)
					.where(
						and(
							eq(notes.documentId, input.id),
							eq(notes.documentType, 'change_order')
						)
					)
					.orderBy(desc(notes.createdAt)),
				db
					.select()
					.from(flowRecords)
					.where(
						and(
							eq(flowRecords.documentId, input.id),
							eq(flowRecords.documentType, 'change_order')
						)
					)
					.orderBy(desc(flowRecords.createdAt))
			]);

			const result: ChangeOrderWithDetails = {
				...changeOrder,
				attachments: attachmentList,
				notes: noteList,
				flowRecords: flowRecordList
			};

			return result;
		}),

	create: protectedProcedure
		.input(
			z.object({
				projectId: z.string().uuid(),
				title: z.string().min(1).max(200),
				description: z.string().optional(),
				reason: z.string().optional(),
				impact: z.string().optional(),
				originalPlan: z.string().optional(),
				newPlan: z.string().optional(),
				costChange: z.number().default(0),
				timeChangeDays: z.number().default(0),
				assignedToId: z.string().uuid().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const today = new Date();
			const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
			const prefix = `CO${dateStr}`;

			const latestOrder = await db
				.select()
				.from(changeOrders)
				.where(ilike(changeOrders.code, `${prefix}%`))
				.orderBy(desc(changeOrders.code))
				.limit(1);

			let sequence = 1;
			if (latestOrder.length > 0) {
				const latestCode = latestOrder[0]?.code;
				if (latestCode) {
					const seqStr = latestCode.slice(prefix.length);
					sequence = parseInt(seqStr, 10) + 1;
				}
			}

			const code = `${prefix}${String(sequence).padStart(3, '0')}`;

			const [changeOrder] = await db
				.insert(changeOrders)
				.values({
					...input,
					code,
					createdById: ctx.user.id
				})
				.returning();

			if (changeOrder) {
				await db.insert(flowRecords).values({
					documentId: changeOrder.id,
					documentType: 'change_order',
					toStatus: 'draft',
					action: 'create',
					comments: '变更单创建',
					performedById: ctx.user.id
				});
			}

			return changeOrder;
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				title: z.string().min(1).max(200).optional(),
				description: z.string().optional(),
				reason: z.string().optional(),
				impact: z.string().optional(),
				originalPlan: z.string().optional(),
				newPlan: z.string().optional(),
				costChange: z.number().optional(),
				timeChangeDays: z.number().optional(),
				assignedToId: z.string().uuid().optional(),
				approvedById: z.string().uuid().optional(),
				approvedAt: z.date().optional()
			})
		)
		.mutation(async ({ input }) => {
			const { id, ...data } = input;
			const [changeOrder] = await db
				.update(changeOrders)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(changeOrders.id, id))
				.returning();

			if (!changeOrder) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '变更单不存在' });
			}

			return changeOrder;
		}),

	updateStatus: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				status: z.enum(['draft', 'pending', 'processing', 'approved', 'rejected', 'completed', 'cancelled']),
				comments: z.string().optional(),
				action: z.string().min(1).max(50)
			})
		)
		.mutation(async ({ input, ctx }) => {
			const [current] = await db
				.select()
				.from(changeOrders)
				.where(eq(changeOrders.id, input.id))
				.limit(1);

			if (!current) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '变更单不存在' });
			}

			const [changeOrder] = await db
				.update(changeOrders)
				.set({ status: input.status, updatedAt: new Date() })
				.where(eq(changeOrders.id, input.id))
				.returning();

			await db.insert(flowRecords).values({
				documentId: input.id,
				documentType: 'change_order',
				fromStatus: current.status,
				toStatus: input.status,
				action: input.action,
				comments: input.comments,
				performedById: ctx.user.id
			});

			return changeOrder;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ input }) => {
			const result = await db.delete(changeOrders).where(eq(changeOrders.id, input.id));
			if ((result as unknown as { rowCount: number }).rowCount === 0) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '变更单不存在' });
			}
			return { success: true };
		})
});
