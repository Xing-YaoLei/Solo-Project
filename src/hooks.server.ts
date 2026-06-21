import type { Handle } from '@sveltejs/kit';
import { validateRequest } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const { user, session } = await validateRequest(event);
	event.locals.user = user ?? null;
	event.locals.session = session ?? null;

	const response = await resolve(event);
	return response;
};
