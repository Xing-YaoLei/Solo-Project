import { z } from 'zod';
import { t, publicProcedure } from '../init';
import { db } from '$lib/server/db';
import { checkinCode } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const checkinRouter = t.router({
	list: publicProcedure
		.input(z.object({ performanceId: z.string() }))
		.query(async ({ input }) => {
			return db
				.select()
				.from(checkinCode)
				.where(eq(checkinCode.performance_id, input.performanceId));
		}),

	create: publicProcedure
		.input(
			z.object({
				performance_id: z.string(),
				code: z.string(),
				ticket_type: z.string(),
				seat_zone_id: z.string().optional()
			})
		)
		.mutation(async ({ input }) => {
			const [created] = await db.insert(checkinCode).values(input).returning();
			return created;
		}),

	batchCreate: publicProcedure
		.input(
			z.object({
				performance_id: z.string(),
				codes: z.array(
					z.object({
						code: z.string(),
						ticket_type: z.string(),
						seat_zone_id: z.string().optional()
					})
				)
			})
		)
		.mutation(async ({ input }) => {
			const values = input.codes.map((c) => ({
				performance_id: input.performance_id,
				...c
			}));
			return db.insert(checkinCode).values(values).returning();
		}),

	markUsed: publicProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ input }) => {
			const [updated] = await db
				.update(checkinCode)
				.set({ status: 'used', used_at: new Date() })
				.where(eq(checkinCode.id, input.id))
				.returning();
			return updated;
		}),

	markExpired: publicProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ input }) => {
			const [updated] = await db
				.update(checkinCode)
				.set({ status: 'expired' })
				.where(eq(checkinCode.id, input.id))
				.returning();
			return updated;
		})
});
