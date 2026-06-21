import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from './db';
import { sessions, users } from './db/schema';
import type { RequestEvent } from '@sveltejs/kit';

const adapter = new DrizzlePostgreSQLAdapter(db, sessions as any, users as any);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: import.meta.env.PROD
		}
	},
	getUserAttributes: (attributes) => {
		return {
			username: attributes.username,
			displayName: attributes.displayName,
			email: attributes.email,
			role: attributes.role,
			avatarUrl: attributes.avatarUrl
		};
	}
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			username: string;
			displayName: string | null;
			email: string;
			role: string | null;
			avatarUrl: string | null;
		};
	}
}

export async function createSession(userId: string) {
	return await lucia.createSession(userId, {});
}

export async function invalidateSession(sessionId: string) {
	await lucia.invalidateSession(sessionId);
}

export async function validateRequest(event: RequestEvent) {
	const sessionId = event.cookies.get(lucia.sessionCookieName);
	if (!sessionId) {
		return { user: null, session: null };
	}
	const { user, session } = await lucia.validateSession(sessionId);
	try {
		if (session && session.fresh) {
			const sessionCookie = lucia.createSessionCookie(session.id);
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});
		}
		if (!session) {
			const blankCookie = lucia.createBlankSessionCookie();
			event.cookies.set(blankCookie.name, blankCookie.value, {
				path: '.',
				...blankCookie.attributes
			});
		}
	} catch {
		// swallow cookie errors
	}
	return { user, session };
}
