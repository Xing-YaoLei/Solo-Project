import { Lucia } from 'lucia';
import { postgresAdapter } from './adapter';
import { pool } from '$server/db';

export const lucia = new Lucia(postgresAdapter(pool as any), {
	sessionCookie: {
		expires: false,
		attributes: {
			secure: process.env.NODE_ENV === 'production'
		}
	},
	getUserAttributes: (attributes: any) => ({
		id: attributes.id,
		username: attributes.username,
		displayName: attributes.display_name,
		roleId: attributes.role_id,
		phone: attributes.phone
	})
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
	}
}
