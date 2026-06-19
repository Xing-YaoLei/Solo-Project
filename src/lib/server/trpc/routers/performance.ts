import { z } from 'zod';
import { t, publicProcedure } from '../init';
import { db } from '$lib/server/db';
import { performance, user, seatZone, sponsor, checkinCode } from '$lib/server/db/schema';
import { eq, and, like, desc } from 'drizzle-orm';

export const performanceRouter = t.router({
	list: publicProcedure
		.input(
			z
				.object({
					status: z.string().optional(),
					search: z.string().optional(),
					assigneeId: z.string().optional()
				})
				.optional()
		)
		.query(async ({ input }) => {
			const conditions = [];
			if (input?.status) conditions.push(eq(performance.status, input.status));
			if (input?.search) conditions.push(like(performance.title, `%${input.search}%`));
			if (input?.assigneeId) conditions.push(eq(performance.assignee_id, input.assigneeId));

			return db
				.select()
				.from(performance)
				.leftJoin(user, eq(performance.assignee_id, user.id))
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(desc(performance.show_date));
		}),

	get: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input }) => {
			const [perf] = await db
				.select()
				.from(performance)
				.where(eq(performance.id, input.id));

			const zones = await db
				.select()
				.from(seatZone)
				.where(eq(seatZone.performance_id, input.id));

			const sponsors = await db
				.select()
				.from(sponsor)
				.where(eq(sponsor.performance_id, input.id));

			const codes = await db
				.select()
				.from(checkinCode)
				.where(eq(checkinCode.performance_id, input.id));

			return { ...perf, seatZones: zones, sponsors, checkinCodes: codes };
		}),

	create: publicProcedure
		.input(
			z.object({
				title: z.string(),
				venue: z.string(),
				show_date: z.coerce.date(),
				duration_minutes: z.number(),
				description: z.string().optional(),
				assignee_id: z.string().optional()
			})
		)
		.mutation(async ({ input }) => {
			const [created] = await db.insert(performance).values(input).returning();
			return created;
		}),

	update: publicProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().optional(),
				venue: z.string().optional(),
				show_date: z.coerce.date().optional(),
				duration_minutes: z.number().optional(),
				description: z.string().optional(),
				assignee_id: z.string().optional(),
				status: z.string().optional()
			})
		)
		.mutation(async ({ input }) => {
			const { id, ...data } = input;
			const [updated] = await db
				.update(performance)
				.set({ ...data, updated_at: new Date() })
				.where(eq(performance.id, id))
				.returning();
			return updated;
		}),

	changeStatus: publicProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.string()
			})
		)
		.mutation(async ({ input }) => {
			const [updated] = await db
				.update(performance)
				.set({ status: input.status, updated_at: new Date() })
				.where(eq(performance.id, input.id))
				.returning();
			return updated;
		})
});
