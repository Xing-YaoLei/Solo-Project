import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';
import { router, workerProcedure, managerProcedure } from '../trpc';
import { changeRecordTable, attachmentTable } from '$server/db/schema';

export const changeRouter = router({
	listByProject: workerProcedure
		.input(
			z.object({
				projectId: z.string().uuid(),
				reviewStatus: z.string().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const whereConditions = [eq(changeRecordTable.projectId, input.projectId)];
			if (input.reviewStatus) {
				whereConditions.push(eq(changeRecordTable.reviewStatus, input.reviewStatus));
			}

			return await ctx.db
				.select()
				.from(changeRecordTable)
				.where(and(...whereConditions))
				.orderBy(desc(changeRecordTable.createdAt));
		}),

	get: workerProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const change = await ctx.db.query.changeRecordTable.findFirst({
				where: eq(changeRecordTable.id, input.id),
				with: {
					creator: true,
					reviewer: true,
					attachments: true
				}
			});
			if (!change) {
				throw new Error('变更记录不存在');
			}
			return change;
		}),

	create: workerProcedure
		.input(
			z.object({
				projectId: z.string().uuid(),
				changeType: z.string().min(2).max(64),
				changeContent: z.string().min(2),
				oldValue: z.any().optional(),
				newValue: z.any().optional(),
				reason: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [change] = await ctx.db
				.insert(changeRecordTable)
				.values({
					...input,
					createdBy: ctx.user.id
				})
				.returning();
			return change;
		}),

	review: managerProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				status: z.enum(['approved', 'rejected', 'returned']),
				comment: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [change] = await ctx.db
				.update(changeRecordTable)
				.set({
					reviewStatus: input.status,
					reviewedBy: ctx.user.id,
					reviewedAt: new Date(),
					reviewComment: input.comment
				})
				.where(eq(changeRecordTable.id, input.id))
				.returning();
			return change;
		}),

	confirmByCustomer: workerProcedure
		.input(
			z.object({
				id: z.string().uuid()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [change] = await ctx.db
				.update(changeRecordTable)
				.set({
					customerConfirmed: true,
					customerConfirmedAt: new Date()
				})
				.where(eq(changeRecordTable.id, input.id))
				.returning();
			return change;
		})
});
