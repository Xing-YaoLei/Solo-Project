import { z } from 'zod';
import { router, protectedProcedure, managerProcedure } from '../trpc';
import { complaintTable, userTable, propertyTable, bookingTable, cleaningTaskTable } from '../db/schema';
import { eq, and, desc, gte, lte, aliasedTable } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';
import { TRPCError } from '@trpc/server';

const severityEnum = z.enum(['low', 'medium', 'high', 'critical']);
const complaintStatusEnum = z.enum(['open', 'investigating', 'resolved', 'closed']);
const sourceEnum = z.enum(['guest', 'platform_review', 'owner', 'inspection', 'other']);

export const complaintRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				propertyId: z.string().optional(),
				taskId: z.string().optional(),
				status: complaintStatusEnum.optional(),
				severity: severityEnum.optional(),
				source: sourceEnum.optional(),
				tag: z.string().optional(),
				dateFrom: z.date().optional(),
				dateTo: z.date().optional(),
				page: z.number().default(1),
				pageSize: z.number().default(50)
			})
		)
		.query(async ({ ctx, input }) => {
			const offset = (input.page - 1) * input.pageSize;

			const conditions = [];
			if (input.propertyId) conditions.push(eq(complaintTable.propertyId, input.propertyId));
			if (input.taskId) conditions.push(eq(complaintTable.taskId, input.taskId));
			if (input.status) conditions.push(eq(complaintTable.status, input.status));
			if (input.severity) conditions.push(eq(complaintTable.severity, input.severity));
			if (input.source) conditions.push(eq(complaintTable.source, input.source));
			if (input.dateFrom) conditions.push(gte(complaintTable.filedAt, input.dateFrom.getTime()));
			if (input.dateTo) conditions.push(lte(complaintTable.filedAt, input.dateTo.getTime()));

			const where = conditions.length > 0 ? and(...conditions) : undefined;

			const handlerUser = aliasedTable(userTable, 'handler');

			const items = await ctx.db
				.select({
					complaint: complaintTable,
					property: propertyTable,
					responsible: userTable,
					handler: handlerUser
				})
				.from(complaintTable)
				.leftJoin(propertyTable, eq(complaintTable.propertyId, propertyTable.id))
				.leftJoin(userTable, eq(complaintTable.responsibleCleanerId, userTable.id))
				.leftJoin(handlerUser, eq(complaintTable.handlerId, handlerUser.id))
				.where(where)
				.orderBy(desc(complaintTable.filedAt))
				.limit(input.pageSize)
				.offset(offset)
				.all();

			const total = await ctx.db
				.select({ count: complaintTable.id })
				.from(complaintTable)
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
			const handlerUser = aliasedTable(userTable, 'handler');

			const complaint = await ctx.db
				.select({
					complaint: complaintTable,
					property: propertyTable,
					booking: bookingTable,
					task: cleaningTaskTable,
					responsible: userTable,
					handler: handlerUser
				})
				.from(complaintTable)
				.leftJoin(propertyTable, eq(complaintTable.propertyId, propertyTable.id))
				.leftJoin(bookingTable, eq(complaintTable.bookingId, bookingTable.id))
				.leftJoin(cleaningTaskTable, eq(complaintTable.taskId, cleaningTaskTable.id))
				.leftJoin(userTable, eq(complaintTable.responsibleCleanerId, userTable.id))
				.leftJoin(handlerUser, eq(complaintTable.handlerId, handlerUser.id))
				.where(eq(complaintTable.id, input.id))
				.get();

			if (!complaint) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '客诉不存在' });
			}

			return complaint;
		}),

	create: protectedProcedure
		.input(
			z.object({
				propertyId: z.string(),
				bookingId: z.string().optional(),
				taskId: z.string().optional(),
				title: z.string().min(1),
				content: z.string().min(1),
				severity: severityEnum.default('medium'),
				source: sourceEnum.default('guest'),
				tags: z.array(z.string()).default([]),
				evidenceUrls: z.array(z.string()).default([]),
				reviewRating: z.number().min(1).max(5).optional(),
				reviewPlatform: z.string().optional(),
				reviewLink: z.string().optional(),
				responsibleCleanerId: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = generateIdFromEntropySize(16);
			return ctx.db
				.insert(complaintTable)
				.values({
					id,
					...input,
					handlerId: ctx.user.id,
					status: 'open'
				})
				.returning()
				.get();
		}),

	update: managerProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().min(1).optional(),
				content: z.string().min(1).optional(),
				severity: severityEnum.optional(),
				source: sourceEnum.optional(),
				tags: z.array(z.string()).optional(),
				evidenceUrls: z.array(z.string()).optional(),
				status: complaintStatusEnum.optional(),
				responsibleCleanerId: z.string().optional().nullable(),
				handlerId: z.string().optional(),
				resolution: z.string().optional().nullable(),
				compensation: z.number().optional().nullable()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const updateData: any = { ...data, updatedAt: new Date() };
			if (data.status === 'resolved' && !data.resolution) {
				// allow resolution to be set separately
			}
			if (data.status === 'resolved') {
				updateData.resolvedAt = Date.now();
			}
			if (data.status === 'closed') {
				updateData.closedAt = Date.now();
			}
			return ctx.db
				.update(complaintTable)
				.set(updateData)
				.where(eq(complaintTable.id, id))
				.returning()
				.get();
		}),

	getAllTags: protectedProcedure.query(async ({ ctx }) => {
		const complaints = await ctx.db.select({ tags: complaintTable.tags }).from(complaintTable).all();
		const tagSet = new Set<string>();
		for (const c of complaints) {
			if (c.tags) {
				c.tags.forEach((t) => tagSet.add(t));
			}
		}
		return Array.from(tagSet).sort();
	})
});
