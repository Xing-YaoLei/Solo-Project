import { Lucia, TimeSpan } from 'lucia';
import { PostgresJsAdapter } from '@lucia-auth/adapter-postgresql';
import { client } from './db';

export const auth = new Lucia(new PostgresJsAdapter(client, {
	user: 'user',
	session: 'session'
}), {
	sessionExpiresIn: new TimeSpan(30, 'd'),
	getUserAttributes: (attributes) => ({
		username: attributes.username,
		displayName: attributes.display_name,
		role: attributes.role
	}),
	sessionCookie: {
		attributes: {
			secure: false
		}
	}
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof auth;
		DatabaseUserAttributes: {
			username: string;
			display_name: string;
			role: string;
		};
	}
}
