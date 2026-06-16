import { Lucia, TimeSpan } from 'lucia';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from '../db';
import { sessions, users, type UserRole } from '../db/schema';
import { dev } from '$app/environment';

const adapter = new DrizzleSQLiteAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: !dev
		}
	},
	sessionExpiresIn: new TimeSpan(7, 'd'),
	getUserAttributes: (attributes) => {
		return {
			username: attributes.username,
			fullName: attributes.fullName,
			role: attributes.role as UserRole,
			phone: attributes.phone,
			avatar: attributes.avatar
		};
	}
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			username: string;
			full_name: string;
			fullName: string;
			role: UserRole;
			phone?: string | null;
			avatar?: string | null;
		};
	}
}
