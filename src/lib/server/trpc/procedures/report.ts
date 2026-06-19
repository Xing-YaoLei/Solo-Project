import { router, authedProcedure, createPermissionGuard } from '$server/trpc/context';
import { z } from 'zod';
import { db } from '$server/db';
import { complaints, users } from '$server/db/schema';
import { eq, and, or, sql, count, gte, lte } from 'drizzle-orm';

const reportGuard = authedProcedure.use(createPermissionGuard(['report:view']));

export const reportRouter = router({
	byClosureDuration: reportGuard.query(async () => {
		const rows = await db
			.select({
				id: complaints.id,
				createdAt: complaints.createdAt,
				closedAt: complaints.closedAt,
				hours: sql<number>`EXTRACT(EPOCH FROM (${complaints.closedAt} - ${complaints.createdAt})) / 3600`
			})
			.from(complaints)
			.where(or(eq(complaints.status, 'closed'), eq(complaints.status, 'resolved')));

		const buckets = [
			{ label: '0-24h', min: 0, max: 24, items: [] as number[] },
			{ label: '24-48h', min: 24, max: 48, items: [] as number[] },
			{ label: '48-72h', min: 48, max: 72, items: [] as number[] },
			{ label: '72h+', min: 72, max: Infinity, items: [] as number[] }
		];

		for (const row of rows) {
			const h = Number(row.hours);
			if (isNaN(h)) continue;
			for (const b of buckets) {
				if (h >= b.min && h < b.max) {
					b.items.push(h);
					break;
				}
			}
		}

		return {
			buckets: buckets.map((b) => ({
				label: b.label,
				count: b.items.length,
				avgHours: b.items.length > 0 ? b.items.reduce((a, c) => a + c, 0) / b.items.length : 0
			}))
		};
	}),

	byDate: reportGuard
		.input(z.object({
			startDate: z.string().optional(),
			endDate: z.string().optional()
		}))
		.query(async ({ input }) => {
			const conditions = [];
			if (input.startDate) conditions.push(gte(complaints.createdAt, new Date(input.startDate)));
			if (input.endDate) conditions.push(lte(complaints.createdAt, new Date(input.endDate)));
			const where = conditions.length > 0 ? and(...conditions) : undefined;

			const rows = await db
				.select({
					date: sql<string>`DATE(${complaints.createdAt})`,
					status: complaints.status,
					total: count()
				})
				.from(complaints)
				.where(where)
				.groupBy(sql`DATE(${complaints.createdAt})`, complaints.status)
				.orderBy(sql`DATE(${complaints.createdAt})`);

			const dateMap = new Map<string, { date: string; total: number; pending: number; inProgress: number; resolved: number; closed: number }>();
			for (const row of rows) {
				if (!dateMap.has(row.date)) {
					dateMap.set(row.date, { date: row.date, total: 0, pending: 0, inProgress: 0, resolved: 0, closed: 0 });
				}
				const entry = dateMap.get(row.date)!;
				entry.total += row.total;
				if (row.status === 'pending') entry.pending += row.total;
				else if (row.status === 'in_progress') entry.inProgress += row.total;
				else if (row.status === 'resolved') entry.resolved += row.total;
				else if (row.status === 'closed') entry.closed += row.total;
			}

			return { dates: Array.from(dateMap.values()) };
		}),

	byAssignee: reportGuard.query(async () => {
		const rows = await db
			.select({
				assigneeId: complaints.assigneeId,
				assigneeName: users.displayName,
				status: complaints.status,
				total: count(),
				avgCloseHours: sql<number>`COALESCE(AVG(CASE WHEN ${complaints.closedAt} IS NOT NULL THEN EXTRACT(EPOCH FROM (${complaints.closedAt} - ${complaints.createdAt})) / 3600 END), 0)`
			})
			.from(complaints)
			.innerJoin(users, eq(complaints.assigneeId, users.id))
			.groupBy(complaints.assigneeId, users.displayName, complaints.status);

		const assigneeMap = new Map<string, { assigneeId: string | null; assigneeName: string; total: number; pending: number; inProgress: number; resolved: number; closed: number; avgCloseHours: number }>();
		for (const row of rows) {
			const key = row.assigneeId!;
			if (!assigneeMap.has(key)) {
				assigneeMap.set(key, { assigneeId: row.assigneeId, assigneeName: row.assigneeName, total: 0, pending: 0, inProgress: 0, resolved: 0, closed: 0, avgCloseHours: 0 });
			}
			const entry = assigneeMap.get(key)!;
			entry.total += row.total;
			if (row.status === 'pending') entry.pending += row.total;
			else if (row.status === 'in_progress') entry.inProgress += row.total;
			else if (row.status === 'resolved') entry.resolved += row.total;
			else if (row.status === 'closed') entry.closed += row.total;
			entry.avgCloseHours = row.avgCloseHours;
		}

		return { assignees: Array.from(assigneeMap.values()) };
	})
});
