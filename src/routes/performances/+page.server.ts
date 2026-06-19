import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { performance, user } from '$lib/server/db/schema';
import { eq, and, or, like, desc, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const status = url.searchParams.get('status');
	const search = url.searchParams.get('search');
	const assignee = url.searchParams.get('assignee');

	const conditions = [];

	if (status) {
		conditions.push(eq(performance.status, status));
	}

	if (search) {
		conditions.push(like(performance.title, `%${search}%`));
	}

	if (assignee) {
		conditions.push(eq(performance.assignee_id, assignee));
	}

	const performances = await db
		.select({
			id: performance.id,
			title: performance.title,
			venue: performance.venue,
			show_date: performance.show_date,
			duration_minutes: performance.duration_minutes,
			status: performance.status,
			assignee_id: performance.assignee_id,
			assignee_name: user.display_name
		})
		.from(performance)
		.leftJoin(user, eq(performance.assignee_id, user.id))
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(performance.show_date));

	const users = await db
		.select({
			id: user.id,
			display_name: user.display_name,
			username: user.username
		})
		.from(user);

	return {
		performances,
		users,
		filters: {
			status: status ?? '',
			search: search ?? '',
			assignee: assignee ?? ''
		}
	};
};
