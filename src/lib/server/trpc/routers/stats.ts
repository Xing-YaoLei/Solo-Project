import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '$lib/server/db';
import { refundOrderTable, refundLogTable } from '$lib/server/db/schema';
import { eq, and, gte, lte, sql, desc, count } from 'drizzle-orm';

export const statsRouter = createTRPCRouter({
	getOverview: protectedProcedure
		.input(
			z.object({
				startDate: z.string().optional(),
				endDate: z.string().optional(),
				region: z.string().optional()
			})
		)
		.query(async ({ input }) => {
			const whereConditions = [];

			if (input.startDate) {
				whereConditions.push(gte(refundOrderTable.createdAt, new Date(input.startDate)));
			}
			if (input.endDate) {
				whereConditions.push(lte(refundOrderTable.createdAt, new Date(input.endDate)));
			}
			if (input.region) {
				whereConditions.push(eq(refundOrderTable.region, input.region));
			}

			const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;

			const statusStats = await db
				.select({
					status: refundOrderTable.status,
					count: count()
				})
				.from(refundOrderTable)
				.where(where)
				.groupBy(refundOrderTable.status);

			return {
				statusStats
			};
		}),

	getClosureStats: protectedProcedure
		.input(
			z.object({
				startDate: z.string().optional(),
				endDate: z.string().optional(),
				region: z.string().optional()
			})
		)
		.query(async ({ input }) => {
			const whereConditions = [eq(refundOrderTable.status, 'closed')];

			if (input.startDate) {
				whereConditions.push(gte(refundOrderTable.closedAt, new Date(input.startDate)));
			}
			if (input.endDate) {
				whereConditions.push(lte(refundOrderTable.closedAt, new Date(input.endDate)));
			}
			if (input.region) {
				whereConditions.push(eq(refundOrderTable.region, input.region));
			}

			const where = and(...whereConditions);

			const orders = await db
				.select({
					id: refundOrderTable.id,
					orderNo: refundOrderTable.orderNo,
					createdAt: refundOrderTable.createdAt,
					closedAt: refundOrderTable.closedAt,
					region: refundOrderTable.region,
					responsibility: refundOrderTable.responsibility,
					issueTag: refundOrderTable.issueTag,
					refundAmount: refundOrderTable.refundAmount,
					followupResult: refundOrderTable.followupResult
				})
				.from(refundOrderTable)
				.where(where)
				.orderBy(desc(refundOrderTable.closedAt))
				.limit(100);

			const ordersWithDuration = orders.map((order) => {
				const durationMs = order.closedAt!.getTime() - order.createdAt.getTime();
				const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;
				return {
					...order,
					durationHours
				};
			});

			const total = ordersWithDuration.length;
			const avgDuration =
				total > 0
					? Math.round(
							(ordersWithDuration.reduce((sum, o) => sum + o.durationHours, 0) / total) * 100
						) / 100
					: 0;
			const maxDuration = total > 0 ? Math.max(...ordersWithDuration.map((o) => o.durationHours)) : 0;
			const minDuration = total > 0 ? Math.min(...ordersWithDuration.map((o) => o.durationHours)) : 0;

			const distribution = {
				lessThan1h: ordersWithDuration.filter((o) => o.durationHours < 1).length,
				oneToFourHours: ordersWithDuration.filter((o) => o.durationHours >= 1 && o.durationHours < 4)
					.length,
				fourTo24Hours: ordersWithDuration.filter((o) => o.durationHours >= 4 && o.durationHours < 24)
					.length,
				oneToThreeDays: ordersWithDuration.filter((o) => o.durationHours >= 24 && o.durationHours < 72)
					.length,
				moreThanThreeDays: ordersWithDuration.filter((o) => o.durationHours >= 72).length
			};

			return {
				total,
				avgDuration,
				maxDuration,
				minDuration,
				distribution,
				orders: ordersWithDuration
			};
		})
});
