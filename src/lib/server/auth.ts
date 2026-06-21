import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from './db';
import { sessions, users } from './db/schema';
import type { User as UserType, Session as SessionType } from './db/schema';

const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: process.env.NODE_ENV === 'production'
		}
	},
	getUserAttributes: (attributes) => {
		return {
			username: attributes.username,
			email: attributes.email,
			fullName: attributes.fullName,
			phone: attributes.phone,
			role: attributes.role,
			avatar: attributes.avatar,
			createdAt: attributes.createdAt,
			updatedAt: attributes.updatedAt
		};
	}
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: Omit<UserType, 'id' | 'passwordHash'>;
	}
}

export type User = Omit<UserType, 'passwordHash'>;
export type Session = SessionType;
