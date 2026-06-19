import { Lucia } from 'lucia';
import { dev } from '$app/environment';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db, schema } from '../db';

const adapter = new DrizzlePostgreSQLAdapter(db, schema.userSessions, schema.users);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: !dev
		}
	},
	getUserAttributes: (attributes) => {
		return {
			username: attributes.username,
			name: attributes.name,
			role: attributes.role
		};
	}
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			username: string;
			name: string;
			role: import('../db/schema').UserRole;
		};
	}
}
