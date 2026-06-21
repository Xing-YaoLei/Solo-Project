import type { RequestEvent } from '@sveltejs/kit';
import type { inferAsyncReturnType } from '@trpc/server';
import type { User, Session } from '../auth';
import { db } from '../db';

type Locals = {
	user: User | null;
	session: Session | null;
};

export async function createContext(event: RequestEvent) {
	return {
		db,
		user: (event.locals as Locals).user,
		session: (event.locals as Locals).session,
		event
	};
}

export type Context = inferAsyncReturnType<typeof createContext>;
