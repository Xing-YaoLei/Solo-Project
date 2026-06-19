import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { exceptionRecord, performance, user } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const status = url.searchParams.get('status');
	const type = url.searchParams.get('type');
	const handlerId = url.searchParams.get('handlerId');

	const conditions = [];

	if (status) {
		conditions.push(eq(exceptionRecord.status, status));
	}

	if (type) {
		conditions.push(eq(exceptionRecord.type, type));
	}

	if (handlerId) {
		conditions.push(eq(exceptionRecord.handler_id, handlerId));
	}

	const exceptions = await db
		.select({
			id: exceptionRecord.id,
			type: exceptionRecord.type,
			status: exceptionRecord.status,
			description: exceptionRecord.description,
			source: exceptionRecord.source,
			handler_id: exceptionRecord.handler_id,
			handler_name: user.display_name,
			performance_id: exceptionRecord.performance_id,
			performance_title: performance.title,
			created_at: exceptionRecord.created_at,
			updated_at: exceptionRecord.updated_at
		})
		.from(exceptionRecord)
		.leftJoin(user, eq(exceptionRecord.handler_id, user.id))
		.leftJoin(performance, eq(exceptionRecord.performance_id, performance.id))
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(exceptionRecord.updated_at));

	const usersList = await db
		.select({
			id: user.id,
			display_name: user.display_name,
			username: user.username
		})
		.from(user);

	const performances = await db
		.select({
			id: performance.id,
			title: performance.title
		})
		.from(performance);

	return {
		exceptions,
		users: usersList,
		performances,
		filters: {
			status: status ?? '',
			type: type ?? '',
			handlerId: handlerId ?? ''
		}
	};
};
