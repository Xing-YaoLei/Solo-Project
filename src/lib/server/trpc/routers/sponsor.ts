import { z } from 'zod';
import { t, publicProcedure } from '../init';
import { db } from '$lib/server/db';
import { sponsor } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const sponsorRouter = t.router({
	list: publicProcedure
		.input(z.object({ performanceId: z.string() }))
		.query(async ({ input }) => {
			return db
				.select()
				.from(sponsor)
				.where(eq(sponsor.performance_id, input.performanceId));
		}),

	create: publicProcedure
		.input(
			z.object({
				performance_id: z.string(),
				name: z.string(),
				contact: z.string().optional(),
				tier: z.string(),
				amount: z.string(),
				notes: z.string().optional()
			})
		)
		.mutation(async ({ input }) => {
			const [created] = await db.insert(sponsor).values(input).returning();
			return created;
		}),

	update: publicProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().optional(),
				contact: z.string().optional(),
				tier: z.string().optional(),
				amount: z.string().optional(),
				notes: z.string().optional()
			})
		)
		.mutation(async ({ input }) => {
			const { id, ...data } = input;
			const [updated] = await db
				.update(sponsor)
				.set(data)
				.where(eq(sponsor.id, id))
				.returning();
			return updated;
		}),

	remove: publicProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ input }) => {
			await db.delete(sponsor).where(eq(sponsor.id, input.id));
		})
});
