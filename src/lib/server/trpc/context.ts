import type { RequestEvent } from '@sveltejs/kit';
import type { inferAsyncReturnType } from '@trpc/server';
import { db } from '../db';
import { lucia } from '../auth/lucia';

export async function createContext(event: RequestEvent) {
	const sessionId = event.cookies.get(lucia.sessionCookieName);
	let user = null;
	let session = null;

	if (sessionId) {
		const sessionResult = await lucia.validateSession(sessionId);
		if (sessionResult.session && sessionResult.user) {
			session = sessionResult.session;
			user = sessionResult.user;
		} else if (sessionResult.session === null) {
			event.cookies.delete(lucia.sessionCookieName, { path: '/' });
		}
	}

	return {
		event,
		db,
		user,
		session
	};
}

export type Context = inferAsyncReturnType<typeof createContext>;
