import { z } from 'zod';
import { t, publicProcedure } from '../init';
import { db } from '$lib/server/db';
import { checkinCode, exceptionRecord, user, performance } from '$lib/server/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export const reportRouter = t.router({
	verificationSummary: publicProcedure
		.input(
			z.object({
				startDate: z.coerce.date(),
				endDate: z.coerce.date()
			})
		)
		.query(async ({ input }) => {
			const results = await db
				.select({
					performance_id: checkinCode.performance_id,
					performance_title: performance.title,
					total: sql<number>`count(*)`,
					used: sql<number>`count(*) filter (where ${checkinCode.status} = 'used')`,
					expired: sql<number>`count(*) filter (where ${checkinCode.status} = 'expired')`,
					unused: sql<number>`count(*) filter (where ${checkinCode.status} = 'unused')`
				})
				.from(checkinCode)
				.leftJoin(performance, eq(checkinCode.performance_id, performance.id))
				.where(
					and(
						gte(checkinCode.created_at, input.startDate),
						lte(checkinCode.created_at, input.endDate)
					)
				)
				.groupBy(checkinCode.performance_id, performance.title);

			return results.map((r) => ({
				...r,
				verification_rate: Number(r.total) > 0 ? Number(r.used) / Number(r.total) : 0
			}));
		}),

	sourceSummary: publicProcedure
		.input(
			z.object({
				startDate: z.coerce.date(),
				endDate: z.coerce.date()
			})
		)
		.query(async ({ input }) => {
			return db
				.select({
					source: exceptionRecord.source,
					count: sql<number>`count(*)`
				})
				.from(exceptionRecord)
				.where(
					and(
						gte(exceptionRecord.created_at, input.startDate),
						lte(exceptionRecord.created_at, input.endDate)
					)
				)
				.groupBy(exceptionRecord.source);
		}),

	handlerSummary: publicProcedure
		.input(
			z.object({
				startDate: z.coerce.date(),
				endDate: z.coerce.date()
			})
		)
		.query(async ({ input }) => {
			return db
				.select({
					handler_id: exceptionRecord.handler_id,
					handler_name: user.display_name,
					count: sql<number>`count(*)`
				})
				.from(exceptionRecord)
				.leftJoin(user, eq(exceptionRecord.handler_id, user.id))
				.where(
					and(
						gte(exceptionRecord.created_at, input.startDate),
						lte(exceptionRecord.created_at, input.endDate)
					)
				)
				.groupBy(exceptionRecord.handler_id, user.display_name);
		}),

	conclusionSummary: publicProcedure
		.input(
			z.object({
				startDate: z.coerce.date(),
				endDate: z.coerce.date()
			})
		)
		.query(async ({ input }) => {
			return db
				.select({
					status: exceptionRecord.status,
					count: sql<number>`count(*)`
				})
				.from(exceptionRecord)
				.where(
					and(
						gte(exceptionRecord.created_at, input.startDate),
						lte(exceptionRecord.created_at, input.endDate)
					)
				)
				.groupBy(exceptionRecord.status);
		})
});
