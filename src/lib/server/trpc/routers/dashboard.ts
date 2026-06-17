import { router, roleProcedure } from '../trpc';
import { db } from '$server/db';
import { workOrders, buildings, rooms } from '$server/db/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';

export const dashboardRouter = router({
	getResponseTrend: roleProcedure('admin')
		.input((input: { range: 'day' | 'week' | 'month'; startDate: string; endDate: string }) => input)
		.query(async ({ input }) => {
			const result = await db
				.select({
					date: sql<string>`DATE(${workOrders.createdAt})`,
					avgResponseMinutes: sql<number>`AVG(EXTRACT(EPOCH FROM (${workOrders.assignedAt} - ${workOrders.createdAt})) / 60)`,
					count: sql<number>`COUNT(*)`
				})
				.from(workOrders)
				.where(
					and(
						gte(workOrders.createdAt, new Date(input.startDate)),
						lte(workOrders.createdAt, new Date(input.endDate)),
						eq(workOrders.status, 'closed')
					)
				)
				.groupBy(sql`DATE(${workOrders.createdAt})`)
				.orderBy(sql`DATE(${workOrders.createdAt})`);

			return result;
		}),

	getOverdueRate: roleProcedure('admin')
		.input((input: { groupBy: 'area' | 'type' }) => input)
		.query(async ({ input }) => {
			if (input.groupBy === 'area') {
				const result = await db
					.select({
						buildingName: buildings.name,
						total: sql<number>`COUNT(*)`,
						overdue: sql<number>`COUNT(CASE WHEN ${workOrders.dueAt} < NOW() AND ${workOrders.status} NOT IN ('completed', 'reviewing', 'closed') THEN 1 END)`
					})
					.from(workOrders)
					.leftJoin(rooms, eq(workOrders.roomId, rooms.id))
					.leftJoin(buildings, eq(rooms.buildingId, buildings.id))
					.groupBy(buildings.name);
				return result;
			}

			const result = await db
				.select({
					priority: workOrders.priority,
					total: sql<number>`COUNT(*)`,
					overdue: sql<number>`COUNT(CASE WHEN ${workOrders.dueAt} < NOW() AND ${workOrders.status} NOT IN ('completed', 'reviewing', 'closed') THEN 1 END)`
				})
				.from(workOrders)
				.groupBy(workOrders.priority);
			return result;
		}),

	getCompletionRate: roleProcedure('admin').query(async () => {
		const [stats] = await db
			.select({
				total: sql<number>`COUNT(*)`,
				completed: sql<number>`COUNT(CASE WHEN ${workOrders.status} IN ('completed', 'reviewing', 'closed') THEN 1 END)`,
				overdue: sql<number>`COUNT(CASE WHEN ${workOrders.dueAt} < NOW() AND ${workOrders.status} NOT IN ('completed', 'reviewing', 'closed') THEN 1 END)`,
				pending: sql<number>`COUNT(CASE WHEN ${workOrders.status} = 'submitted' THEN 1 END)`,
				inProgress: sql<number>`COUNT(CASE WHEN ${workOrders.status} IN ('assigned', 'in_progress') THEN 1 END)`
			})
			.from(workOrders);

		return stats;
	})
});
