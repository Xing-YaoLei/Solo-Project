import type { RequestEvent } from '@sveltejs/kit';
import { db } from '../db';
import type { AuthUser } from '../auth/lucia';
import { validateSession } from '../auth/service';

export interface TRPCContext {
	db: typeof db;
	user: AuthUser | null;
	event: RequestEvent;
}

export async function createContext(event: RequestEvent): Promise<TRPCContext> {
	const sessionId = event.cookies.get(lucia.sessionCookieName);

	let user: AuthUser | null = null;

	if (sessionId) {
		user = await validateSession(sessionId);
	}

	return {
		db,
		user,
		event
	};
}

import { lucia } from '../auth/lucia';
