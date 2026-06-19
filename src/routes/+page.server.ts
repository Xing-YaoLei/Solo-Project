import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { performance, user, exceptionRecord, checkinCode } from '$lib/server/db/schema';
import { eq, and, gte, lte, sql, desc, ne } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const performances = await db
		.select({
			id: performance.id,
			title: performance.title,
			venue: performance.venue,
			show_date: performance.show_date,
			status: performance.status,
			assignee_name: user.display_name
		})
		.from(performance)
		.leftJoin(user, eq(performance.assignee_id, user.id))
		.orderBy(desc(performance.show_date))
		.limit(20);

	const [totalRow] = await db
		.select({ count: sql<number>`count(*)` })
		.from(performance);

	const [inProgressRow] = await db
		.select({ count: sql<number>`count(*)` })
		.from(performance)
		.where(eq(performance.status, 'in_progress'));

	const [pendingExceptionsRow] = await db
		.select({ count: sql<number>`count(*)` })
		.from(exceptionRecord)
		.where(ne(exceptionRecord.status, 'closed'));

	const now = new Date();
	const weekStart = new Date(now);
	weekStart.setDate(weekStart.getDate() - weekStart.getDay());
	weekStart.setHours(0, 0, 0, 0);
	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 7);

	const [verificationRow] = await db
		.select({
			total: sql<number>`count(*)`,
			used: sql<number>`count(*) filter (where ${checkinCode.status} = 'used')`
		})
		.from(checkinCode)
		.where(
			and(
				gte(checkinCode.created_at, weekStart),
				lte(checkinCode.created_at, weekEnd)
			)
		);

	const verificationRate =
		Number(verificationRow?.total ?? 0) > 0
			? Number(verificationRow?.used ?? 0) / Number(verificationRow.total)
			: 0;

	return {
		performances,
		stats: {
			total: Number(totalRow?.count ?? 0),
			inProgress: Number(inProgressRow?.count ?? 0),
			pendingExceptions: Number(pendingExceptionsRow?.count ?? 0),
			verificationRate
		}
	};
};
