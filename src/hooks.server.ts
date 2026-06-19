import type { Handle } from '@sveltejs/kit';
import { lucia } from '$server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(lucia.sessionCookieName);
	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
	} else {
		const { session, user } = await lucia.validateSession(sessionId);
		try {
			if (session && session.fresh) {
				const cookie = lucia.createSessionCookie(session.id);
				event.cookies.set(cookie.name, cookie.value, {
					path: '.',
					...cookie.attributes
				});
			}
			if (!session) {
				const cookie = lucia.createBlankSessionCookie();
				event.cookies.set(cookie.name, cookie.value, {
					path: '.',
					...cookie.attributes
				});
			}
		} catch {}
		event.locals.user = user;
		event.locals.session = session;
	}

	return resolve(event);
};
