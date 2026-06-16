import { lucia } from '$lib/server/lucia';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(lucia.sessionCookieName);
	
	if (!sessionId) {
		event.locals.user = null;
		return resolve(event);
	}

	const { session, user } = await lucia.validateSession(sessionId);
	
	try {
		if (session?.fresh) {
			const sessionCookie = lucia.createSessionCookie(session.id);
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});
		}
		if (!session) {
			const sessionCookie = lucia.createBlankSessionCookie();
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});
		}
	} catch {
		// ignore
	}

	event.locals.user = user;
	return resolve(event);
};
