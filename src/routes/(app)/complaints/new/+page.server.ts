import { createCaller } from '$server/trpc/caller';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const caller = await createCaller(event);

	if (!event.locals.user) {
		throw redirect(302, '/login');
	}

	const hasPermission = (event.locals.user as any).permissions?.includes('complaint:create')
		|| (event.locals.user as any).roleName === 'visitor';

	if (!hasPermission && !(event.locals.user as any).roleName) {
		const [tags] = await Promise.all([caller.tag.list({})]);
		return { tags };
	}

	const [tags] = await Promise.all([caller.tag.list({})]);

	return {
		tags,
		user: event.locals.user
	};
};
