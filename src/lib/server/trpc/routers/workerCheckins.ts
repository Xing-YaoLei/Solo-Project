import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '$lib/server/db';
import { workerCheckins, flowRecords } from '$lib/server/db/schema';
import type { WorkerCheckin } from '$lib/server/db/schema';
import { eq, desc, and, gte, lte, type SQL } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const workerCheckinsRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(20),
				projectId: z.string().uuid().optional(),
				changeOrderId: z.string().uuid().optional(),
				workerId: z.string().uuid().optional(),
				startDate: z.date().optional(),
				endDate: z.date().optional()
			})
		)
		.query(async ({ input }) => {
			const where: SQL<unknown>[] = [];
			if (input.projectId) {
				where.push(eq(workerCheckins.projectId, input.projectId));
			}
			if (input.changeOrderId) {
				where.push(eq(workerCheckins.changeOrderId, input.changeOrderId));
			}
			if (input.workerId) {
				where.push(eq(workerCheckins.workerId, input.workerId));
			}
			if (input.startDate) {
				where.push(gte(workerCheckins.checkinTime, input.startDate));
			}
			if (input.endDate) {
				where.push(lte(workerCheckins.checkinTime, input.endDate));
			}

			const data = await db
				.select()
				.from(workerCheckins)
				.where(where.length > 0 ? and(...where) : undefined)
				.orderBy(desc(workerCheckins.checkinTime))
				.limit(input.pageSize)
				.offset((input.page - 1) * input.pageSize);

			const total = await db.$count(workerCheckins, where.length > 0 ? and(...where) : undefined);

			return { data, total, page: input.page, pageSize: input.pageSize };
		}),

	get: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ input }) => {
			const [checkin] = await db
				.select()
				.from(workerCheckins)
				.where(eq(workerCheckins.id, input.id))
				.limit(1);

			if (!checkin) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '签到记录不存在' });
			}

			return checkin as WorkerCheckin;
		}),

	checkin: protectedProcedure
		.input(
			z.object({
				projectId: z.string().uuid(),
				changeOrderId: z.string().uuid().optional(),
				location: z.any().optional(),
				workContent: z.string().optional(),
				photos: z.array(z.string()).optional(),
				notes: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const [checkin] = await db
				.insert(workerCheckins)
				.values({
					...input,
					workerId: ctx.user.id,
					checkinTime: new Date()
				})
				.returning();

			await db.insert(flowRecords).values({
				documentId: checkin!.id,
				documentType: 'worker_checkin',
				toStatus: 'processing',
				action: 'checkin',
				comments: '工人签到',
				performedById: ctx.user.id
			});

			return checkin as WorkerCheckin;
		}),

	checkout: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				notes: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const [existing] = await db
				.select()
				.from(workerCheckins)
				.where(eq(workerCheckins.id, input.id))
				.limit(1);

			if (!existing) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '签到记录不存在' });
			}

			if (existing.workerId !== ctx.user.id && ctx.user.role !== 'admin' && ctx.user.role !== 'foreman') {
				throw new TRPCError({ code: 'FORBIDDEN', message: '无权限签退此记录' });
			}

			const checkoutTime = new Date();
			const workHours = existing.checkinTime
				? Math.max(0, Math.round((checkoutTime.getTime() - existing.checkinTime.getTime()) / (1000 * 60 * 60)))
				: 0;

			const [checkin] = await db
				.update(workerCheckins)
				.set({
					checkoutTime,
					workHours,
					notes: input.notes ?? existing.notes,
					updatedAt: new Date()
				})
				.where(eq(workerCheckins.id, input.id))
				.returning();

			await db.insert(flowRecords).values({
				documentId: input.id,
				documentType: 'worker_checkin',
				fromStatus: 'processing',
				toStatus: 'completed',
				action: 'checkout',
				comments: `工人签退，工作时长 ${workHours} 小时`,
				performedById: ctx.user.id
			});

			return checkin as WorkerCheckin;
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				projectId: z.string().uuid().optional(),
				changeOrderId: z.string().uuid().optional(),
				checkinTime: z.date().optional(),
				checkoutTime: z.date().optional(),
				location: z.any().optional(),
				workContent: z.string().optional(),
				workHours: z.number().optional(),
				photos: z.array(z.string()).optional(),
				notes: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { id, ...data } = input;
			const [checkin] = await db
				.update(workerCheckins)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(workerCheckins.id, id))
				.returning();

			if (!checkin) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '签到记录不存在' });
			}

			return checkin as WorkerCheckin;
		}),

	verify: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				verified: z.boolean().default(true)
			})
		)
		.mutation(async ({ input, ctx }) => {
			const [checkin] = await db
				.update(workerCheckins)
				.set({
					verified: input.verified,
					verifiedById: ctx.user.id,
					verifiedAt: new Date(),
					updatedAt: new Date()
				})
				.where(eq(workerCheckins.id, input.id))
				.returning();

			if (!checkin) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '签到记录不存在' });
			}

			return checkin as WorkerCheckin;
		}),

	getMyCheckins: protectedProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(20),
				startDate: z.date().optional(),
				endDate: z.date().optional()
			})
		)
		.query(async ({ input, ctx }) => {
			const where: SQL<unknown>[] = [eq(workerCheckins.workerId, ctx.user.id)];
			if (input.startDate) {
				where.push(gte(workerCheckins.checkinTime, input.startDate));
			}
			if (input.endDate) {
				where.push(lte(workerCheckins.checkinTime, input.endDate));
			}

			const data = await db
				.select()
				.from(workerCheckins)
				.where(and(...where))
				.orderBy(desc(workerCheckins.checkinTime))
				.limit(input.pageSize)
				.offset((input.page - 1) * input.pageSize);

			const total = await db.$count(workerCheckins, and(...where));

			return { data, total, page: input.page, pageSize: input.pageSize };
		})
});
