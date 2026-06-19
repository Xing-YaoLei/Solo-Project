import { Lucia, TimeSpan } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from './db';
import { session, user } from './db/schema';
import type { UserRole } from '$lib/types';

const adapter = new DrizzlePostgreSQLAdapter(db as any, session as any, user as any);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: !import.meta.env.DEV
		}
	},
	sessionExpiresIn: new TimeSpan(30, 'd'),
	getUserAttributes: (data) => {
		return {
			id: data.id,
			email: data.email,
			username: data.username,
			role: data.role as UserRole,
			avatar: data.avatar,
			phone: data.phone
		};
	}
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			id: string;
			email: string;
			username: string;
			role: string;
			avatar?: string | null;
			phone?: string | null;
		};
	}
}
