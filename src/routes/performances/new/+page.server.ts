import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { performance, user } from '$lib/server/db/schema';

export const load = async () => {
	const users = await db
		.select({
			id: user.id,
			display_name: user.display_name,
			username: user.username
		})
		.from(user);

	return { users };
};

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const title = formData.get('title') as string;
		const venue = formData.get('venue') as string;
		const show_date = formData.get('show_date') as string;
		const duration_minutes = formData.get('duration_minutes') as string;
		const description = formData.get('description') as string;
		const assignee_id = formData.get('assignee_id') as string;

		if (!title || !venue || !show_date || !duration_minutes) {
			return fail(400, { message: '请填写所有必填字段' });
		}

		const [result] = await db
			.insert(performance)
			.values({
				title,
				venue,
				show_date: new Date(show_date),
				duration_minutes: Number(duration_minutes),
				description: description || null,
				assignee_id: assignee_id || null,
				status: 'draft'
			})
			.returning({ id: performance.id });

		throw redirect(302, `/performance/${result.id}`);
	}
};
