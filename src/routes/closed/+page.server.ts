import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { performance, exceptionRecord, user } from '$lib/server/db/schema';
import { eq, and, like, gte, lte, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search');
	const dateFrom = url.searchParams.get('dateFrom');
	const dateTo = url.searchParams.get('dateTo');

	const perfConditions = [eq(performance.status, 'closed')];

	if (search) {
		perfConditions.push(like(performance.title, `%${search}%`));
	}

	if (dateFrom) {
		perfConditions.push(gte(performance.show_date, new Date(dateFrom)));
	}

	if (dateTo) {
		perfConditions.push(lte(performance.show_date, new Date(dateTo)));
	}

	const performances = await db
		.select({
			id: performance.id,
			title: performance.title,
			venue: performance.venue,
			show_date: performance.show_date,
			updated_at: performance.updated_at,
			assignee_name: user.display_name
		})
		.from(performance)
		.leftJoin(user, eq(performance.assignee_id, user.id))
		.where(and(...perfConditions))
		.orderBy(desc(performance.updated_at));

	const excConditions = [eq(exceptionRecord.status, 'closed')];

	if (dateFrom) {
		excConditions.push(gte(exceptionRecord.updated_at, new Date(dateFrom)));
	}

	if (dateTo) {
		excConditions.push(lte(exceptionRecord.updated_at, new Date(dateTo)));
	}

	const exceptions = await db
		.select({
			id: exceptionRecord.id,
			type: exceptionRecord.type,
			performance_id: exceptionRecord.performance_id,
			performance_title: performance.title,
			handler_id: exceptionRecord.handler_id,
			handler_name: user.display_name,
			resolution: exceptionRecord.resolution,
			updated_at: exceptionRecord.updated_at
		})
		.from(exceptionRecord)
		.leftJoin(user, eq(exceptionRecord.handler_id, user.id))
		.leftJoin(performance, eq(exceptionRecord.performance_id, performance.id))
		.where(and(...excConditions))
		.orderBy(desc(exceptionRecord.updated_at));

	return {
		performances,
		exceptions,
		filters: {
			search: search ?? '',
			dateFrom: dateFrom ?? '',
			dateTo: dateTo ?? ''
		}
	};
};
