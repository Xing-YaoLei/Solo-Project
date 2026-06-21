import type { RequestEvent } from '@sveltejs/kit';
import { db } from '../db';
import type { User } from 'lucia';

export type Context = {
	db: typeof db;
	user: User | null;
	req: Request;
	event: RequestEvent;
};

export async function createContext(event: RequestEvent): Promise<Context> {
	return {
		db,
		user: event.locals.user ?? null,
		req: event.request,
		event
	};
}
