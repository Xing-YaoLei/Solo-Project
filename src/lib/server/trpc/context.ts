import type { RequestEvent } from '@sveltejs/kit';
import type { inferRouterContext } from '@trpc/server';
import { createCallerFactory } from '@trpc/server';
import type { AppRouter } from './router';
import { db } from '../db';
import type { User } from '../db/schema';
import { lucia } from '../auth/lucia';

export async function createContext(event: RequestEvent) {
	let user: User | null = null;

	const sessionId = event.cookies.get(lucia.sessionCookieName);
	if (sessionId) {
		const { session, user: dbUser } = await lucia.validateSession(sessionId);
		if (session && session.fresh) {
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
		if (dbUser) {
			user = dbUser as User;
		}
	}

	return {
		db,
		user,
		event
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
