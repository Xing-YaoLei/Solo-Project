import { Lucia, TimeSpan } from 'lucia';
import { PostgreSQLAdapter } from '@lucia-auth/adapter-postgresql';
import { db } from '$server/db';
import { sql } from 'drizzle-orm';

const adapter = new PostgreSQLAdapter(db as any, {
	user: 'users',
	session: 'sessions'
});

export const lucia = new Lucia(adapter, {
	sessionExpiresIn: new TimeSpan(24, 'h'),
	sessionCookie: {
		attributes: {
			secure: !import.meta.env.DEV
		}
	},
	getUserAttributes: (attributes) => {
		return {
			username: attributes.username,
			displayName: attributes.display_name,
			role: attributes.role
		};
	}
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			username: string;
			display_name: string;
			role: string;
		};
	}
}
