import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from '../db';
import { sessions, users } from '../db/schema';
import type { UserRoleCode } from '../db/schema';

const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: import.meta.env.DEV === false
		}
	},
	getUserAttributes: (attributes) => {
		return {
			id: attributes.id,
			email: attributes.email,
			name: attributes.name,
			avatar: attributes.avatar,
			isActive: attributes.isActive
		};
	}
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			id: string;
			email: string;
			name: string;
			avatar?: string | null;
			isActive: boolean;
		};
	}
}

export interface AuthUser {
	id: string;
	email: string;
	name: string;
	avatar?: string | null;
	roles: UserRoleCode[];
	permissions: Record<string, boolean>;
}
