import type { Handle, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { lucia } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { ensureDbInitialized } from '$lib/server/init-db';

let dbInitialized = false;

const initDbHandle: Handle = async ({ event, resolve }) => {
	if (!dbInitialized) {
		await ensureDbInitialized();
		dbInitialized = true;
	}
	return resolve(event);
};

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(lucia.sessionCookieName);
	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await lucia.validateSession(sessionId);
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

	if (user) {
		const dbUser = await db.select().from(userTable).where(eq(userTable.id, user.id)).get();
		event.locals.user = dbUser || null;
	} else {
		event.locals.user = null;
	}
	event.locals.session = session;

	return resolve(event);
};

export const handle: Handle = sequence(initDbHandle, handleAuth);

export const handleError: HandleServerError = async ({ error, event }) => {
	const errorId = crypto.randomUUID();
	console.error('Error', errorId, error);
	return {
		message: '发生了一个错误',
		errorId
	};
};
