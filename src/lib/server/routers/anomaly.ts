import { z } from 'zod';
import { router, protectedProcedure, managerProcedure } from '../trpc';
import { anomalyTable, userTable, propertyTable, cleaningTaskTable, bookingTable } from '../db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';
import { TRPCError } from '@trpc/server';

const anomalyTypeEnum = z.enum(['missed_cleaning', 'late_cleaning', 'quality_issue', 'no_show', 'other']);
const anomalyStatusEnum = z.enum(['pending', 'handling', 'resolved', 'closed']);
const impactLevelEnum = z.enum(['low', 'medium', 'high', 'critical']);

export const anomalyRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				propertyId: z.string().optional(),
				taskId: z.string().optional(),
				type: anomalyTypeEnum.optional(),
				status: anomalyStatusEnum.optional(),
				impactLevel: impactLevelEnum.optional(),
				responsiblePersonId: z.string().optional(),
				dateFrom: z.date().optional(),
				dateTo: z.date().optional(),
				page: z.number().default(1),
				pageSize: z.number().default(50)
			})
		)
		.query(async ({ ctx, input }) => {
			const offset = (input.page - 1) * input.pageSize;

			const conditions = [];
			if (input.propertyId) conditions.push(eq(anomalyTable.propertyId, input.propertyId));
			if (input.taskId) conditions.push(eq(anomalyTable.taskId, input.taskId));
			if (input.type) conditions.push(eq(anomalyTable.type, input.type));
			if (input.status) conditions.push(eq(anomalyTable.status, input.status));
			if (input.impactLevel) conditions.push(eq(anomalyTable.impactLevel, input.impactLevel));
			if (input.responsiblePersonId) conditions.push(eq(anomalyTable.responsiblePersonId, input.responsiblePersonId));
			if (input.dateFrom) conditions.push(gte(anomalyTable.discoveredAt, input.dateFrom.getTime()));
			if (input.dateTo) conditions.push(lte(anomalyTable.discoveredAt, input.dateTo.getTime()));

			const where = conditions.length > 0 ? and(...conditions) : undefined;

			const items = await ctx.db
				.select({
					anomaly: anomalyTable,
					property: propertyTable,
					task: cleaningTaskTable,
					responsible: userTable,
					discoverer: userTable,
					handler: userTable
				})
				.from(anomalyTable)
				.leftJoin(propertyTable, eq(anomalyTable.propertyId, propertyTable.id))
				.leftJoin(cleaningTaskTable, eq(anomalyTable.taskId, cleaningTaskTable.id))
				.leftJoin(userTable, eq(anomalyTable.responsiblePersonId, userTable.id))
				.leftJoin(userTable.as('discoverer'), eq(anomalyTable.discoveredById, userTable.as('discoverer').id))
				.leftJoin(userTable.as('handler'), eq(anomalyTable.handledById, userTable.as('handler').id))
				.where(where)
				.orderBy(desc(anomalyTable.discoveredAt))
				.limit(input.pageSize)
				.offset(offset)
				.all();

			const total = await ctx.db
				.select({ count: anomalyTable.id })
				.from(anomalyTable)
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
			const anomaly = await ctx.db
				.select({
					anomaly: anomalyTable,
					property: propertyTable,
					task: cleaningTaskTable,
					responsible: userTable,
					discoverer: userTable,
					handler: userTable
				})
				.from(anomalyTable)
				.leftJoin(propertyTable, eq(anomalyTable.propertyId, propertyTable.id))
				.leftJoin(cleaningTaskTable, eq(anomalyTable.taskId, cleaningTaskTable.id))
				.leftJoin(userTable, eq(anomalyTable.responsiblePersonId, userTable.id))
				.leftJoin(userTable.as('discoverer'), eq(anomalyTable.discoveredById, userTable.as('discoverer').id))
				.leftJoin(userTable.as('handler'), eq(anomalyTable.handledById, userTable.as('handler').id))
				.where(eq(anomalyTable.id, input.id))
				.get();

			if (!anomaly) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '异常单不存在' });
			}

			return anomaly;
		}),

	create: protectedProcedure
		.input(
			z.object({
				taskId: z.string(),
				propertyId: z.string(),
				type: anomalyTypeEnum.default('missed_cleaning'),
				title: z.string().min(1),
				description: z.string().min(1),
				impactScope: z.string().min(1),
				impactedBookings: z.array(z.string()).default([]),
				impactLevel: impactLevelEnum.default('medium'),
				responsiblePersonId: z.string().optional(),
				responsibleRole: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = generateIdFromEntropySize(16);
			return ctx.db
				.insert(anomalyTable)
				.values({
					id,
					...input,
					discoveredById: ctx.user.id,
					status: 'pending'
				})
				.returning()
				.get();
		}),

	update: managerProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().min(1).optional(),
				description: z.string().min(1).optional(),
				impactScope: z.string().optional(),
				impactedBookings: z.array(z.string()).optional(),
				impactLevel: impactLevelEnum.optional(),
				responsiblePersonId: z.string().optional().nullable(),
				responsibleRole: z.string().optional().nullable(),
				status: anomalyStatusEnum.optional(),
				handlingMeasures: z.string().optional().nullable(),
				handlingResult: z.string().optional().nullable(),
				handlingConclusion: z.string().optional().nullable(),
				penalty: z.string().optional().nullable(),
				compensation: z.number().optional().nullable(),
				followUpRequired: z.boolean().optional(),
				followUpNotes: z.string().optional().nullable()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const updateData: any = { ...data, updatedAt: new Date() };
			if ((data.status === 'resolved' || data.status === 'closed') && !updateData.handledAt) {
				updateData.handledAt = Date.now();
				updateData.handledById = ctx.user.id;
			}
			if (data.status === 'closed') {
				updateData.closedAt = Date.now();
			}
			return ctx.db
				.update(anomalyTable)
				.set(updateData)
				.where(eq(anomalyTable.id, id))
				.returning()
				.get();
		}),

	generateFromMissedTasks: managerProcedure
		.input(
			z.object({
				dateFrom: z.date(),
				dateTo: z.date()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const missedTasks = await ctx.db
				.select()
				.from(cleaningTaskTable)
				.where(
					and(
						eq(cleaningTaskTable.status, 'missed'),
						gte(cleaningTaskTable.scheduledDate, input.dateFrom.getTime()),
						lte(cleaningTaskTable.scheduledDate, input.dateTo.getTime())
					)
				)
				.all();

			const results = [];
			for (const task of missedTasks) {
				const existing = await ctx.db
					.select()
					.from(anomalyTable)
					.where(eq(anomalyTable.taskId, task.id))
					.get();
				if (!existing) {
					const id = generateIdFromEntropySize(16);
					results.push(
						await ctx.db
							.insert(anomalyTable)
							.values({
								id,
								taskId: task.id,
								propertyId: task.propertyId,
								type: 'missed_cleaning',
								title: `保洁漏单 - ${new Date(task.scheduledDate).toLocaleDateString()}`,
								description: `保洁任务未在计划时间内完成，任务ID: ${task.id}`,
								impactScope: task.bookingId ? '影响客人入住体验，可能导致客诉或平台差评' : '影响后续预订排期',
								impactLevel: task.bookingId ? 'high' : 'medium',
								responsiblePersonId: task.assignedCleanerId,
								responsibleRole: task.assignedCleanerId ? '保洁员' : '排班人员',
								discoveredById: ctx.user.id,
								status: 'pending'
							})
							.returning()
							.get()
					);
				}
			}
			return results;
		})
});
