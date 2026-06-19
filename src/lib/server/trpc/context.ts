import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { auth } from '$lib/server/auth';

export function createContext(event: RequestEvent) {
	return {
		db,
		auth,
		event,
		user: event.locals.user,
		session: event.locals.session
	};
}

export type Context = ReturnType<typeof createContext>;
