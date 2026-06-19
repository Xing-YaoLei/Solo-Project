import { z } from 'zod';
import { router, protectedProcedure, managerProcedure } from '../trpc';
import { cleaningTaskTable, taskStatusHistoryTable, userTable, propertyTable, bookingTable } from '../db/schema';
import { eq, and, desc, gte, lte, isNull, or } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';
import { TRPCError } from '@trpc/server';

const taskStatusEnum = z.enum(['pending', 'assigned', 'accepted', 'in_progress', 'completed', 'verified', 'cancelled', 'missed']);
const taskTypeEnum = z.enum(['checkout_cleaning', 'periodic_cleaning', 'deep_cleaning', 'maintenance']);
const priorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);

export const cleaningTaskRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				propertyId: z.string().optional(),
				cleanerId: z.string().optional(),
				status: taskStatusEnum.optional(),
				type: taskTypeEnum.optional(),
				dateFrom: z.date().optional(),
				dateTo: z.date().optional(),
				page: z.number().default(1),
				pageSize: z.number().default(50)
			})
		)
		.query(async ({ ctx, input }) => {
			const offset = (input.page - 1) * input.pageSize;

			const conditions = [];
			if (input.propertyId) {
				conditions.push(eq(cleaningTaskTable.propertyId, input.propertyId));
			}
			if (input.cleanerId) {
				conditions.push(eq(cleaningTaskTable.assignedCleanerId, input.cleanerId));
			}
			if (input.status) {
				conditions.push(eq(cleaningTaskTable.status, input.status));
			}
			if (input.type) {
				conditions.push(eq(cleaningTaskTable.type, input.type));
			}
			if (input.dateFrom) {
				conditions.push(gte(cleaningTaskTable.scheduledDate, input.dateFrom.getTime()));
			}
			if (input.dateTo) {
				conditions.push(lte(cleaningTaskTable.scheduledDate, input.dateTo.getTime()));
			}

			const where = conditions.length > 0 ? and(...conditions) : undefined;

			const items = await ctx.db
				.select({
					task: cleaningTaskTable,
					property: propertyTable,
					cleaner: userTable
				})
				.from(cleaningTaskTable)
				.leftJoin(propertyTable, eq(cleaningTaskTable.propertyId, propertyTable.id))
				.leftJoin(userTable, eq(cleaningTaskTable.assignedCleanerId, userTable.id))
				.where(where)
				.orderBy(desc(cleaningTaskTable.scheduledDate))
				.limit(input.pageSize)
				.offset(offset)
				.all();

			const total = await ctx.db
				.select({ count: cleaningTaskTable.id })
				.from(cleaningTaskTable)
				.where(where)
				.all()
				.then((rows) => rows.length);

			return {
				items,
				total,
				page: input.page,
				pageSize: input.pageSize,
				totalPages: Math.ceil(total / input.pageSize)
			};
		}),

	get: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const task = await ctx.db
				.select({
					task: cleaningTaskTable,
					property: propertyTable,
					cleaner: userTable,
					verifier: userTable,
					booking: bookingTable
				})
				.from(cleaningTaskTable)
				.leftJoin(propertyTable, eq(cleaningTaskTable.propertyId, propertyTable.id))
				.leftJoin(userTable, eq(cleaningTaskTable.assignedCleanerId, userTable.id))
				.leftJoin(userTable.as('verifier'), eq(cleaningTaskTable.verifiedById, userTable.as('verifier').id))
				.leftJoin(bookingTable, eq(cleaningTaskTable.bookingId, bookingTable.id))
				.where(eq(cleaningTaskTable.id, input.id))
				.get();

			if (!task) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '任务不存在' });
			}

			const history = await ctx.db
				.select({
					history: taskStatusHistoryTable,
					changer: userTable
				})
				.from(taskStatusHistoryTable)
				.leftJoin(userTable, eq(taskStatusHistoryTable.changedById, userTable.id))
				.where(eq(taskStatusHistoryTable.taskId, input.id))
				.orderBy(desc(taskStatusHistoryTable.changedAt))
				.all();

			return {
				...task,
				statusHistory: history
			};
		}),

	create: managerProcedure
		.input(
			z.object({
				propertyId: z.string(),
				bookingId: z.string().optional(),
				assignedCleanerId: z.string().optional(),
				scheduledDate: z.date(),
				scheduledStartTime: z.string().optional(),
				deadlineTime: z.date().optional(),
				type: taskTypeEnum.default('checkout_cleaning'),
				priority: priorityEnum.default('medium'),
				description: z.string().optional(),
				checklist: z.array(z.string()).default([])
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = generateIdFromEntropySize(16);
			const initialStatus: typeof cleaningTaskTable.status.enumValues[number] = input.assignedCleanerId ? 'assigned' : 'pending';

			const task = await ctx.db
				.insert(cleaningTaskTable)
				.values({
					id,
					...input,
					scheduledDate: input.scheduledDate.getTime(),
					deadlineTime: input.deadlineTime?.getTime(),
					status: initialStatus,
					createdById: ctx.user.id
				})
				.returning()
				.get();

			await ctx.db
				.insert(taskStatusHistoryTable)
				.values({
					id: generateIdFromEntropySize(16),
					taskId: id,
					fromStatus: null,
					toStatus: initialStatus,
					reason: '任务创建',
					changedById: ctx.user.id
				})
				.run();

			return task;
		}),

	update: managerProcedure
		.input(
			z.object({
				id: z.string(),
				assignedCleanerId: z.string().optional().nullable(),
				scheduledDate: z.date().optional(),
				scheduledStartTime: z.string().optional().nullable(),
				deadlineTime: z.date().optional().nullable(),
				type: taskTypeEnum.optional(),
				priority: priorityEnum.optional(),
				description: z.string().optional().nullable(),
				checklist: z.array(z.string()).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const existing = await ctx.db.select().from(cleaningTaskTable).where(eq(cleaningTaskTable.id, id)).get();
			if (!existing) {
				throw new TRPCError({ code: 'NOT_FOUND' });
			}

			let newStatus = existing.status;
			let statusChanged = false;
			if (data.assignedCleanerId !== undefined) {
				if (data.assignedCleanerId && existing.status === 'pending') {
					newStatus = 'assigned';
					statusChanged = true;
				} else if (!data.assignedCleanerId && existing.status === 'assigned') {
					newStatus = 'pending';
					statusChanged = true;
				}
			}

			const updateData: any = {
				...data,
				scheduledDate: data.scheduledDate?.getTime(),
				deadlineTime: data.deadlineTime?.getTime(),
				status: newStatus,
				updatedAt: new Date()
			};

			const task = await ctx.db
				.update(cleaningTaskTable)
				.set(updateData)
				.where(eq(cleaningTaskTable.id, id))
				.returning()
				.get();

			if (statusChanged) {
				await ctx.db
					.insert(taskStatusHistoryTable)
					.values({
						id: generateIdFromEntropySize(16),
						taskId: id,
						fromStatus: existing.status,
						toStatus: newStatus,
						reason: '更新任务信息',
						changedById: ctx.user.id
					})
					.run();
			}

			return task;
		}),

	changeStatus: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				status: taskStatusEnum,
				reason: z.string().optional(),
				qualityScore: z.number().min(0).max(100).optional(),
				cleanerNotes: z.string().optional(),
				inspectorNotes: z.string().optional(),
				photos: z.array(z.string()).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.select().from(cleaningTaskTable).where(eq(cleaningTaskTable.id, input.id)).get();
			if (!existing) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '任务不存在' });
			}

			const allowedTransitions: Record<string, string[]> = {
				pending: ['assigned', 'cancelled'],
				assigned: ['accepted', 'pending', 'cancelled'],
				accepted: ['in_progress', 'assigned', 'cancelled'],
				in_progress: ['completed', 'accepted'],
				completed: ['verified', 'in_progress'],
				verified: ['completed'],
				cancelled: [],
				missed: ['pending']
			};

			if (existing.status !== input.status && !allowedTransitions[existing.status]?.includes(input.status)) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: `不允许从 ${existing.status} 变更为 ${input.status}`
				});
			}

			const updateData: any = {
				status: input.status,
				updatedAt: new Date()
			};

			if (input.status === 'in_progress') {
				updateData.actualStartTime = Date.now();
			}
			if (input.status === 'completed') {
				updateData.actualEndTime = Date.now();
				if (input.cleanerNotes) updateData.cleanerNotes = input.cleanerNotes;
				if (input.photos) updateData.photos = input.photos;
			}
			if (input.status === 'verified') {
				updateData.verifiedAt = Date.now();
				updateData.verifiedById = ctx.user.id;
				if (input.qualityScore !== undefined) updateData.qualityScore = input.qualityScore;
				if (input.inspectorNotes) updateData.inspectorNotes = input.inspectorNotes;
			}

			const task = await ctx.db
				.update(cleaningTaskTable)
				.set(updateData)
				.where(eq(cleaningTaskTable.id, input.id))
				.returning()
				.get();

			if (existing.status !== input.status) {
				await ctx.db
					.insert(taskStatusHistoryTable)
					.values({
						id: generateIdFromEntropySize(16),
						taskId: input.id,
						fromStatus: existing.status,
						toStatus: input.status,
						reason: input.reason || '状态变更',
						changedById: ctx.user.id
					})
					.run();
			}

			return task;
		}),

	acceptTask: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const task = await ctx.db.select().from(cleaningTaskTable).where(eq(cleaningTaskTable.id, input.id)).get();
			if (!task) throw new TRPCError({ code: 'NOT_FOUND' });
			if (task.assignedCleanerId !== ctx.user.id) {
				throw new TRPCError({ code: 'FORBIDDEN', message: '只能接受分配给自己的任务' });
			}

			return ctx.db
				.update(cleaningTaskTable)
				.set({ status: 'accepted', updatedAt: new Date() })
				.where(eq(cleaningTaskTable.id, input.id))
				.returning()
				.get();
		}),

	batchCreate: managerProcedure
		.input(
			z.object({
				propertyIds: z.array(z.string()),
				scheduledDate: z.date(),
				type: taskTypeEnum.default('checkout_cleaning'),
				priority: priorityEnum.default('medium')
			})
		)
		.mutation(async ({ ctx, input }) => {
			const tasks = [];
			for (const propertyId of input.propertyIds) {
				const id = generateIdFromEntropySize(16);
				tasks.push({
					id,
					propertyId,
					scheduledDate: input.scheduledDate.getTime(),
					type: input.type,
					priority: input.priority,
					status: 'pending' as const,
					createdById: ctx.user.id
				});
			}
			await ctx.db.insert(cleaningTaskTable).values(tasks).run();
			return tasks;
		}),

	getStatusHistory: protectedProcedure
		.input(z.object({ taskId: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.db
				.select({
					history: taskStatusHistoryTable,
					changer: userTable
				})
				.from(taskStatusHistoryTable)
				.leftJoin(userTable, eq(taskStatusHistoryTable.changedById, userTable.id))
				.where(eq(taskStatusHistoryTable.taskId, input.taskId))
				.orderBy(desc(taskStatusHistoryTable.changedAt))
				.all();
		})
});
