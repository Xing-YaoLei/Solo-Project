import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { checkinCode, exceptionRecord, performance, user } from '$lib/server/db/schema';
import { eq, and, gte, lte, sql, count } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const now = new Date();
	const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
	const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);

	const dateFrom = url.searchParams.get('dateFrom') ?? defaultFrom.toISOString().slice(0, 10);
	const dateTo = url.searchParams.get('dateTo') ?? defaultTo.toISOString().slice(0, 10);

	const performancesInRange = await db
		.select({
			id: performance.id,
			title: performance.title
		})
		.from(performance)
		.where(
			and(
				gte(performance.show_date, new Date(dateFrom)),
				lte(performance.show_date, new Date(dateTo + 'T23:59:59'))
			)
		);

	const verificationSummary = [];

	for (const perf of performancesInRange) {
		const codes = await db
			.select({
				status: checkinCode.status,
				total: count()
			})
			.from(checkinCode)
			.where(eq(checkinCode.performance_id, perf.id))
			.groupBy(checkinCode.status);

		let total = 0;
		let used = 0;
		let expired = 0;
		let unused = 0;

		for (const row of codes) {
			total += row.total;
			if (row.status === 'used') used += row.total;
			else if (row.status === 'expired') expired += row.total;
			else unused += row.total;
		}

		if (total > 0) {
			verificationSummary.push({
				performance_id: perf.id,
				performance_title: perf.title,
				total,
				used,
				unused,
				expired,
				verification_rate: Math.round((used / total) * 10000) / 100
			});
		}
	}

	verificationSummary.sort((a, b) => a.verification_rate - b.verification_rate);

	const sourceSummary = await db
		.select({
			source: exceptionRecord.source,
			count: count()
		})
		.from(exceptionRecord)
		.where(
			and(
				gte(exceptionRecord.created_at, new Date(dateFrom)),
				lte(exceptionRecord.created_at, new Date(dateTo + 'T23:59:59'))
			)
		)
		.groupBy(exceptionRecord.source);

	const handlerSummary = await db
		.select({
			handler_id: exceptionRecord.handler_id,
			handler_name: user.display_name,
			count: count()
		})
		.from(exceptionRecord)
		.leftJoin(user, eq(exceptionRecord.handler_id, user.id))
		.where(
			and(
				gte(exceptionRecord.created_at, new Date(dateFrom)),
				lte(exceptionRecord.created_at, new Date(dateTo + 'T23:59:59'))
			)
		)
		.groupBy(exceptionRecord.handler_id, user.display_name);

	const conclusionSummary = await db
		.select({
			status: exceptionRecord.status,
			count: count()
		})
		.from(exceptionRecord)
		.where(
			and(
				sql`${exceptionRecord.status} IN ('resolved', 'closed', 'escalated', 'missing_docs')`,
				gte(exceptionRecord.updated_at, new Date(dateFrom)),
				lte(exceptionRecord.updated_at, new Date(dateTo + 'T23:59:59'))
			)
		)
		.groupBy(exceptionRecord.status);

	return {
		verificationSummary,
		sourceSummary,
		handlerSummary,
		conclusionSummary,
		dateFrom,
		dateTo
	};
};
