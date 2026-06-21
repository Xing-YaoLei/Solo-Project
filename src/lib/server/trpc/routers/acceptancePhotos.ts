import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '$lib/server/db';
import {
	acceptancePhotos,
	flowRecords,
	attachments,
	notes,
	documentTypeEnum,
	statusEnum,
	type AcceptancePhoto,
	type FlowRecord,
	type Attachment,
	type Note
} from '$lib/server/db/schema';
import { eq, desc, ilike, and, or, type SQL, asc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

type AcceptancePhotoWithDetails = AcceptancePhoto & {
	attachments: Attachment[];
	notes: Note[];
	flowRecords: FlowRecord[];
};

export const acceptancePhotosRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(20),
				projectId: z.string().uuid().optional(),
				changeOrderId: z.string().uuid().optional(),
				status: z.enum(['draft', 'pending', 'processing', 'approved', 'rejected', 'completed', 'cancelled']).optional()
			})
		)
		.query(async ({ input }) => {
			const where: SQL<unknown>[] = [];
			if (input.projectId) {
				where.push(eq(acceptancePhotos.projectId, input.projectId));
			}
			if (input.changeOrderId) {
				where.push(eq(acceptancePhotos.changeOrderId, input.changeOrderId));
			}
			if (input.status) {
				where.push(eq(acceptancePhotos.status, input.status));
			}

			const data = await db
				.select()
				.from(acceptancePhotos)
				.where(where.length > 0 ? and(...where) : undefined)
				.orderBy(desc(acceptancePhotos.createdAt))
				.limit(input.pageSize)
				.offset((input.page - 1) * input.pageSize);

			const total = await db.$count(acceptancePhotos, where.length > 0 ? and(...where) : undefined);

			return { data, total, page: input.page, pageSize: input.pageSize };
		}),

	get: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ input }) => {
			const [acceptancePhoto] = await db
				.select()
				.from(acceptancePhotos)
				.where(eq(acceptancePhotos.id, input.id))
				.limit(1);

			if (!acceptancePhoto) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '验收记录不存在' });
			}

			const [attachmentList, noteList, flowRecordList] = await Promise.all([
				db
					.select()
					.from(attachments)
					.where(
						and(
							eq(attachments.documentId, input.id),
							eq(attachments.documentType, 'acceptance_photo')
						)
					)
					.orderBy(asc(attachments.createdAt)),
				db
					.select()
					.from(notes)
					.where(
						and(
							eq(notes.documentId, input.id),
							eq(notes.documentType, 'acceptance_photo')
						)
					)
					.orderBy(desc(notes.createdAt)),
				db
					.select()
					.from(flowRecords)
					.where(
						and(
							eq(flowRecords.documentId, input.id),
							eq(flowRecords.documentType, 'acceptance_photo')
						)
					)
					.orderBy(desc(flowRecords.createdAt))
			]);

			const result: AcceptancePhotoWithDetails = {
				...acceptancePhoto,
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
				changeOrderId: z.string().uuid().optional(),
				title: z.string().min(1).max(200),
				stage: z.string().max(100).optional(),
				description: z.string().optional(),
				photoUrls: z.array(z.string()).default([]),
				inspectionItems: z.array(z.any()).default([]),
				comments: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const today = new Date();
			const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
			const prefix = `AP${dateStr}`;

			const latestPhoto = await db
				.select()
				.from(acceptancePhotos)
				.where(ilike(acceptancePhotos.code, `${prefix}%`))
				.orderBy(desc(acceptancePhotos.code))
				.limit(1);

			let sequence = 1;
			if (latestPhoto.length > 0) {
				const latestCode = latestPhoto[0]?.code;
				if (latestCode) {
					const seqStr = latestCode.slice(prefix.length);
					sequence = parseInt(seqStr, 10) + 1;
				}
			}

			const code = `${prefix}${String(sequence).padStart(3, '0')}`;

			const [acceptancePhoto] = await db
				.insert(acceptancePhotos)
				.values({
					...input,
					code,
					createdById: ctx.user.id
				})
				.returning();

			if (acceptancePhoto) {
				await db.insert(flowRecords).values({
					documentId: acceptancePhoto.id,
					documentType: 'acceptance_photo',
					toStatus: 'pending',
					action: 'create',
					comments: '验收记录创建',
					performedById: ctx.user.id
				});
			}

			return acceptancePhoto;
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				title: z.string().min(1).max(200).optional(),
				stage: z.string().max(100).optional(),
				description: z.string().optional(),
				photoUrls: z.array(z.string()).optional(),
				inspectionItems: z.array(z.any()).optional(),
				comments: z.string().optional(),
				changeOrderId: z.string().uuid().optional()
			})
		)
		.mutation(async ({ input }) => {
			const { id, ...data } = input;
			const [acceptancePhoto] = await db
				.update(acceptancePhotos)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(acceptancePhotos.id, id))
				.returning();

			if (!acceptancePhoto) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '验收记录不存在' });
			}

			return acceptancePhoto;
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
				.from(acceptancePhotos)
				.where(eq(acceptancePhotos.id, input.id))
				.limit(1);

			if (!current) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '验收记录不存在' });
			}

			const [acceptancePhoto] = await db
				.update(acceptancePhotos)
				.set({ status: input.status, updatedAt: new Date() })
				.where(eq(acceptancePhotos.id, input.id))
				.returning();

			await db.insert(flowRecords).values({
				documentId: input.id,
				documentType: 'acceptance_photo',
				fromStatus: current.status,
				toStatus: input.status,
				action: input.action,
				comments: input.comments,
				performedById: ctx.user.id
			});

			return acceptancePhoto;
		}),

	verify: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				accepted: z.boolean(),
				comments: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const [current] = await db
				.select()
				.from(acceptancePhotos)
				.where(eq(acceptancePhotos.id, input.id))
				.limit(1);

			if (!current) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '验收记录不存在' });
			}

			const newStatus = input.accepted ? 'approved' : 'rejected';

			const [acceptancePhoto] = await db
				.update(acceptancePhotos)
				.set({
					accepted: input.accepted,
					inspectedById: ctx.user.id,
					inspectedAt: new Date(),
					comments: input.comments,
					status: newStatus,
					updatedAt: new Date()
				})
				.where(eq(acceptancePhotos.id, input.id))
				.returning();

			await db.insert(flowRecords).values({
				documentId: input.id,
				documentType: 'acceptance_photo',
				fromStatus: current.status,
				toStatus: newStatus,
				action: input.accepted ? 'approve' : 'reject',
				comments: input.comments || (input.accepted ? '验收通过' : '验收不通过'),
				performedById: ctx.user.id
			});

			return acceptancePhoto;
		})
});
