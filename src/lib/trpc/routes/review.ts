import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';
import { router, workerProcedure, managerProcedure } from '../trpc';
import { reviewOpinionTable, communicationNoteTable } from '$server/db/schema';

export const reviewRouter = router({
	listByProject: workerProcedure
		.input(z.object({ projectId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			return await ctx.db
				.select()
				.from(reviewOpinionTable)
				.where(eq(reviewOpinionTable.projectId, input.projectId))
				.orderBy(desc(reviewOpinionTable.createdAt));
		}),

	create: managerProcedure
		.input(
			z.object({
				projectId: z.string().uuid(),
				targetType: z.string().min(2).max(64),
				targetId: z.string().uuid(),
				content: z.string().min(1),
				status: z.enum(['comment', 'issue', 'critical', 'resolved']).default('comment')
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [opinion] = await ctx.db
				.insert(reviewOpinionTable)
				.values({
					...input,
					reviewerId: ctx.user.id
				})
				.returning();
			return opinion;
		}),

	addCommunicationNote: workerProcedure
		.input(
			z.object({
				projectId: z.string().uuid(),
				reviewOpinionId: z.string().uuid(),
				content: z.string().min(1),
				communicationType: z.enum(['internal', 'customer']).default('internal'),
				customerInvolved: z.boolean().default(false)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [note] = await ctx.db
				.insert(communicationNoteTable)
				.values({
					...input,
					communicatorId: ctx.user.id
				})
				.returning();
			return note;
		}),

	updateStatus: managerProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				status: z.enum(['comment', 'issue', 'critical', 'resolved'])
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [opinion] = await ctx.db
				.update(reviewOpinionTable)
				.set({ status: input.status })
				.where(eq(reviewOpinionTable.id, input.id))
				.returning();
			return opinion;
		}),

	getRiskList: workerProcedure
		.input(
			z.object({
				projectId: z.string().uuid().optional(),
				minRiskLevel: z.enum(['comment', 'issue', 'critical']).default('comment')
			})
		)
		.query(async ({ ctx, input }) => {
			const riskOrder = { critical: 3, issue: 2, comment: 1 };
			const minOrder = riskOrder[input.minRiskLevel];

			const whereConditions = [];
			if (input.projectId) {
				whereConditions.push(eq(reviewOpinionTable.projectId, input.projectId));
			}

			const opinions = await ctx.db
				.select()
				.from(reviewOpinionTable)
				.where(whereConditions.length ? and(...whereConditions) : undefined)
				.orderBy(desc(reviewOpinionTable.createdAt));

			return opinions
				.filter((o) => riskOrder[o.status as keyof typeof riskOrder] >= minOrder)
				.sort((a, b) => {
					const orderA = riskOrder[a.status as keyof typeof riskOrder] || 0;
					const orderB = riskOrder[b.status as keyof typeof riskOrder] || 0;
					return orderB - orderA;
				});
		})
});
