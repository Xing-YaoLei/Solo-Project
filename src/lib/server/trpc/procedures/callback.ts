import { router, authedProcedure, createPermissionGuard } from '$server/trpc/context';
import { z } from 'zod';
import { db } from '$server/db';
import { callbackResults } from '$server/db/schema';
import { eq } from 'drizzle-orm';

const callbackGuard = authedProcedure.use(createPermissionGuard(['complaint:callback']));

export const callbackRouter = router({
	list: authedProcedure
		.input(z.object({ complaintId: z.string() }))
		.query(async ({ input }) => {
			return await db
				.select()
				.from(callbackResults)
				.where(eq(callbackResults.complaintId, input.complaintId));
		}),

	create: callbackGuard
		.input(z.object({
			complaintId: z.string(),
			visitorSatisfied: z.boolean(),
			comment: z.string().optional()
		}))
		.mutation(async ({ ctx, input }) => {
			const [created] = await db.insert(callbackResults).values({
				complaintId: input.complaintId,
				visitorSatisfied: input.visitorSatisfied,
				comment: input.comment ?? null,
				operatorId: ctx.user.id
			}).returning();
			return created;
		})
});
