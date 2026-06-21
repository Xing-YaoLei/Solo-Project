import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '$lib/server/db';
import {
	materialDelays,
	affectedObjects,
	flowRecords,
	documentTypeEnum,
	statusEnum,
	roleEnum,
	delayReasonEnum
} from '$lib/server/db/schema';
import { eq, desc, and, type SQL } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const materialDelaysRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(20),
				projectId: z.string().uuid().optional(),
				changeOrderId: z.string().uuid().optional(),
				status: z.enum(['draft', 'pending', 'processing', 'approved', 'rejected', 'completed', 'cancelled']).optional(),
				responsibleRole: z.enum(['project_manager', 'designer', 'foreman', 'worker', 'supplier', 'client', 'admin']).optional()
			})
		)
		.query(async ({ input }) => {
			const where: SQL<unknown>[] = [];
			if (input.projectId) {
				where.push(eq(materialDelays.projectId, input.projectId));
			}
			if (input.changeOrderId) {
				where.push(eq(materialDelays.changeOrderId, input.changeOrderId));
			}
			if (input.status) {
				where.push(eq(materialDelays.status, input.status));
			}
			if (input.responsibleRole) {
				where.push(eq(materialDelays.responsibleRole, input.responsibleRole));
			}

			const data = await db
				.select()
				.from(materialDelays)
				.where(where.length > 0 ? and(...where) : undefined)
				.orderBy(desc(materialDelays.createdAt))
				.limit(input.pageSize)
				.offset((input.page - 1) * input.pageSize);

			const total = await db.$count(materialDelays, where.length > 0 ? and(...where) : undefined);

			return { data, total, page: input.page, pageSize: input.pageSize };
		}),

	get: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ input }) => {
			const [materialDelay] = await db
				.select()
				.from(materialDelays)
				.where(eq(materialDelays.id, input.id))
				.limit(1);

			if (!materialDelay) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '材料延期记录不存在' });
			}

			const affectedObjectsList = await db
				.select()
				.from(affectedObjects)
				.where(eq(affectedObjects.materialDelayId, input.id));

			return { ...materialDelay, affectedObjects: affectedObjectsList };
		}),

	create: protectedProcedure
		.input(
			z.object({
				projectId: z.string().uuid(),
				changeOrderId: z.string().uuid().optional(),
				materialName: z.string().min(1).max(200),
				materialType: z.string().max(100).optional(),
				quantity: z.string().max(100).optional(),
				originalDeliveryDate: z.date(),
				expectedDeliveryDate: z.date(),
				reason: z.enum(['supplier_delay', 'production_issue', 'transport_issue', 'customs_clearance', 'other']),
				description: z.string().optional(),
				status: z.enum(['draft', 'pending', 'processing', 'approved', 'rejected', 'completed', 'cancelled']).default('processing'),
				delayDays: z.number().default(0),
				responsibleRole: z.enum(['project_manager', 'designer', 'foreman', 'worker', 'supplier', 'client', 'admin']),
				responsibleId: z.string().uuid().optional(),
				affectedObjects: z.array(
					z.object({
						objectType: z.string().max(50),
						objectName: z.string().max(200),
						objectId: z.string().uuid().optional(),
						impactDescription: z.string().optional(),
						estimatedDelayDays: z.number().default(0)
					})
				).default([])
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { affectedObjects: affectedObjectsInput, ...data } = input;

			const [materialDelay] = await db
				.insert(materialDelays)
				.values({
					...data,
					createdById: ctx.user.id
				})
				.returning();

			if (!materialDelay) {
				throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '创建材料延期记录失败' });
			}

			if (affectedObjectsInput.length > 0) {
				await db.insert(affectedObjects).values(
					affectedObjectsInput.map((obj) => ({
						...obj,
						materialDelayId: materialDelay.id
					}))
				);
			}

			await db.insert(flowRecords).values({
				documentId: materialDelay.id,
				documentType: 'change_order',
				toStatus: data.status,
				action: 'create',
				comments: '材料延期记录创建',
				performedById: ctx.user.id
			});

			const affectedObjectsList = await db
				.select()
				.from(affectedObjects)
				.where(eq(affectedObjects.materialDelayId, materialDelay.id));

			return { ...materialDelay, affectedObjects: affectedObjectsList };
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				materialName: z.string().min(1).max(200).optional(),
				materialType: z.string().max(100).optional(),
				quantity: z.string().max(100).optional(),
				originalDeliveryDate: z.date().optional(),
				expectedDeliveryDate: z.date().optional(),
				reason: z.enum(['supplier_delay', 'production_issue', 'transport_issue', 'customs_clearance', 'other']).optional(),
				description: z.string().optional(),
				delayDays: z.number().optional()
			})
		)
		.mutation(async ({ input }) => {
			const { id, ...data } = input;
			const [materialDelay] = await db
				.update(materialDelays)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(materialDelays.id, id))
				.returning();

			if (!materialDelay) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '材料延期记录不存在' });
			}

			return materialDelay;
		}),

	updateStatus: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				status: z.enum(['draft', 'pending', 'processing', 'approved', 'rejected', 'completed', 'cancelled']),
				comments: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const [existing] = await db
				.select()
				.from(materialDelays)
				.where(eq(materialDelays.id, input.id))
				.limit(1);

			if (!existing) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '材料延期记录不存在' });
			}

			const [materialDelay] = await db
				.update(materialDelays)
				.set({ status: input.status, updatedAt: new Date() })
				.where(eq(materialDelays.id, input.id))
				.returning();

			if (!materialDelay) {
				throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '更新材料延期记录失败' });
			}

			await db.insert(flowRecords).values({
				documentId: materialDelay.id,
				documentType: 'change_order',
				fromStatus: existing.status,
				toStatus: input.status,
				action: 'update_status',
				comments: input.comments,
				performedById: ctx.user.id
			});

			return materialDelay;
		}),

	transferResponsibility: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				newResponsibleId: z.string().uuid(),
				newResponsibleRole: z.enum(['project_manager', 'designer', 'foreman', 'worker', 'supplier', 'client', 'admin']),
				transferNote: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const [existing] = await db
				.select()
				.from(materialDelays)
				.where(eq(materialDelays.id, input.id))
				.limit(1);

			if (!existing) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '材料延期记录不存在' });
			}

			const [materialDelay] = await db
				.update(materialDelays)
				.set({
					responsibleId: input.newResponsibleId,
					responsibleRole: input.newResponsibleRole,
					previousResponsibleId: existing.responsibleId,
					lastTransferAt: new Date(),
					transferNote: input.transferNote,
					updatedAt: new Date()
				})
				.where(eq(materialDelays.id, input.id))
				.returning();

			if (!materialDelay) {
				throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '转移责任失败' });
			}

			await db.insert(flowRecords).values({
				documentId: materialDelay.id,
				documentType: 'change_order',
				fromStatus: existing.status,
				toStatus: existing.status,
				action: 'transfer',
				comments: input.transferNote,
				performedById: ctx.user.id
			});

			return materialDelay;
		}),

	addAffectedObject: protectedProcedure
		.input(
			z.object({
				materialDelayId: z.string().uuid(),
				objectType: z.string().max(50),
				objectName: z.string().max(200),
				objectId: z.string().uuid().optional(),
				impactDescription: z.string().optional(),
				estimatedDelayDays: z.number().default(0)
			})
		)
		.mutation(async ({ input }) => {
			const [existing] = await db
				.select()
				.from(materialDelays)
				.where(eq(materialDelays.id, input.materialDelayId))
				.limit(1);

			if (!existing) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '材料延期记录不存在' });
			}

			const [affectedObject] = await db
				.insert(affectedObjects)
				.values({
					materialDelayId: input.materialDelayId,
					objectType: input.objectType,
					objectName: input.objectName,
					objectId: input.objectId,
					impactDescription: input.impactDescription,
					estimatedDelayDays: input.estimatedDelayDays
				})
				.returning();

			return affectedObject;
		}),

	removeAffectedObject: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ input }) => {
			const result = await db.delete(affectedObjects).where(eq(affectedObjects.id, input.id));
			if ((result as unknown as { rowCount: number }).rowCount === 0) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '受影响对象不存在' });
			}
			return { success: true };
		})
});
