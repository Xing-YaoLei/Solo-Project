import { z } from 'zod';
import { t, publicProcedure } from '../init';
import { db } from '$lib/server/db';
import { seatZone } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const seatRouter = t.router({
	list: publicProcedure
		.input(z.object({ performanceId: z.string() }))
		.query(async ({ input }) => {
			return db
				.select()
				.from(seatZone)
				.where(eq(seatZone.performance_id, input.performanceId));
		}),

	create: publicProcedure
		.input(
			z.object({
				performance_id: z.string(),
				zone_name: z.string(),
				zone_type: z.string(),
				total_seats: z.number(),
				available_seats: z.number(),
				price: z.string()
			})
		)
		.mutation(async ({ input }) => {
			const [created] = await db.insert(seatZone).values(input).returning();
			return created;
		}),

	update: publicProcedure
		.input(
			z.object({
				id: z.string(),
				zone_name: z.string().optional(),
				total_seats: z.number().optional(),
				available_seats: z.number().optional(),
				price: z.string().optional()
			})
		)
		.mutation(async ({ input }) => {
			const { id, ...data } = input;
			const [updated] = await db
				.update(seatZone)
				.set(data)
				.where(eq(seatZone.id, id))
				.returning();
			return updated;
		}),

	remove: publicProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ input }) => {
			await db.delete(seatZone).where(eq(seatZone.id, input.id));
		})
});
