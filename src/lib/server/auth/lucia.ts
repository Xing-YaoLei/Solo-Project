import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from '../db/index.js';
import { users, userSessions } from '../db/schema.js';

const adapter = new DrizzlePostgreSQLAdapter(db, userSessions, users);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: process.env.NODE_ENV === 'production'
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
			role: 'ADVISOR' | 'TECHNICIAN' | 'PARTS' | 'MANAGER';
		};
	}
}

export type AuthUser = {
	id: string;
	username: string;
	name: string;
	role: 'ADVISOR' | 'TECHNICIAN' | 'PARTS' | 'MANAGER';
};
