import { Lucia } from 'lucia';
import { pg } from '@lucia-auth/adapter-postgresql';
import { pool } from '$server/db';

export const lucia = new Lucia(
	pg(pool as any) as any,
	{
		getUserAttributes: (attributes: any) => ({
			id: attributes.id,
			username: attributes.username,
			displayName: attributes.display_name,
			roleId: attributes.role_id,
			roleName: attributes.role_name,
			phone: attributes.phone
		}),
		getSessionAttributes: (attributes: any) => ({
			id: attributes.id
		})
	}
);

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
	}
}
