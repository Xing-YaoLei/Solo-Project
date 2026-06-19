import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { exceptionRecord, performance, user } from '$lib/server/db/schema';

export const load = async ({ url }) => {
	const performances = await db
		.select({
			id: performance.id,
			title: performance.title
		})
		.from(performance);

	const users = await db
		.select({
			id: user.id,
			display_name: user.display_name,
			username: user.username
		})
		.from(user);

	const preselectedPerformanceId = url.searchParams.get('performanceId') ?? '';

	return { performances, users, preselectedPerformanceId };
};

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const performance_id = formData.get('performance_id') as string;
		const type = formData.get('type') as string;
		const description = formData.get('description') as string;
		const source = formData.get('source') as string;

		if (!performance_id || !type || !description) {
			return fail(400, { message: '请填写所有必填字段' });
		}

		const [result] = await db
			.insert(exceptionRecord)
			.values({
				performance_id,
				type,
				description,
				source: source || null,
				status: 'pending'
			})
			.returning({ id: exceptionRecord.id });

		throw redirect(302, `/exception/${result.id}`);
	}
};
