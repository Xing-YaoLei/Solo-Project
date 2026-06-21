import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';
import { router, workerProcedure } from '../trpc';
import { attachmentTable } from '$server/db/schema';

export const attachmentRouter = router({
	listByProject: workerProcedure
		.input(
			z.object({
				projectId: z.string().uuid(),
				categoryId: z.string().uuid().optional(),
				onlyValid: z.boolean().default(true)
			})
		)
		.query(async ({ ctx, input }) => {
			const whereConditions = [eq(attachmentTable.projectId, input.projectId)];
			if (input.categoryId) {
				whereConditions.push(eq(attachmentTable.categoryId, input.categoryId));
			}
			if (input.onlyValid) {
				whereConditions.push(eq(attachmentTable.isValid, true));
			}

			return await ctx.db
				.select()
				.from(attachmentTable)
				.where(and(...whereConditions))
				.orderBy(desc(attachmentTable.createdAt));
		}),

	upload: workerProcedure
		.input(
			z.object({
				projectId: z.string().uuid(),
				categoryId: z.string().uuid().optional(),
				changeRecordId: z.string().uuid().optional(),
				fileName: z.string().min(1).max(255),
				filePath: z.string().min(1).max(500),
				fileSize: z.number().int().optional(),
				fileType: z.string().max(64).optional(),
				description: z.string().optional(),
				version: z.string().max(32).default('1.0')
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [attachment] = await ctx.db
				.insert(attachmentTable)
				.values({
					...input,
					uploadedBy: ctx.user.id
				})
				.returning();
			return attachment;
		}),

	invalidate: workerProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const [attachment] = await ctx.db
				.update(attachmentTable)
				.set({ isValid: false })
				.where(eq(attachmentTable.id, input.id))
				.returning();
			return attachment;
		})
});
