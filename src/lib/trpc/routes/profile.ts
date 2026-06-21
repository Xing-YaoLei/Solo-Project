import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { router, workerProcedure } from '../trpc';
import { customerProfileTable, projectTable } from '$server/db/schema';

export const profileRouter = router({
	getByProject: workerProcedure
		.input(z.object({ projectId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			return await ctx.db.query.customerProfileTable.findFirst({
				where: eq(customerProfileTable.projectId, input.projectId)
			});
		}),

	upsert: workerProcedure
		.input(
			z.object({
				projectId: z.string().uuid(),
				idCardNo: z.string().max(32).optional(),
				address: z.string().max(500).optional(),
				email: z.string().max(128).optional(),
				emergencyContact: z.string().max(128).optional(),
				emergencyPhone: z.string().max(20).optional(),
				houseArea: z.number().int().optional().nullable(),
				houseType: z.string().max(64).optional(),
				decorationStyle: z.string().max(64).optional(),
				budget: z.number().int().optional().nullable(),
				notes: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.query.customerProfileTable.findFirst({
				where: eq(customerProfileTable.projectId, input.projectId)
			});

			if (existing) {
				const updateData: any = { ...input };
				delete updateData.projectId;
				updateData.updatedAt = new Date();

				const [profile] = await ctx.db
					.update(customerProfileTable)
					.set(updateData)
					.where(eq(customerProfileTable.id, existing.id))
					.returning();
				return profile;
			} else {
				const [profile] = await ctx.db
					.insert(customerProfileTable)
					.values(input)
					.returning();
				return profile;
			}
		})
});
