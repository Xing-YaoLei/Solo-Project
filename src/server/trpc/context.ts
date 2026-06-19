import type { RequestEvent } from '@sveltejs/kit';
import type { TRPCContext } from './t';
import { db } from '$server/db';
import { lucia } from '$server/auth';

export async function createContext(event: RequestEvent): Promise<TRPCContext> {
	const sessionId = event.cookies.get(lucia.sessionCookieName);
	let user: TRPCContext['user'] = null;

	if (sessionId) {
		const { session, user: dbUser } = await lucia.validateSession(sessionId);
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
		user = dbUser;
	}

	return {
		db,
		user,
		event
	};
}
