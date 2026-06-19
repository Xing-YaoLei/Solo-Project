import { lucia } from '$server/auth';
import type { Handle } from '@sveltejs/kit';
import { db } from '$server/db';
import { roles, permissions, rolePermissions } from '$server/db/schema';
import { eq } from 'drizzle-orm';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(lucia.sessionCookieName);
	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await lucia.validateSession(sessionId);

	if (session && session.fresh) {
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/',
			...sessionCookie.attributes
		});
	}

	if (!session) {
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/',
			...sessionCookie.attributes
		});
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	let roleName = 'unknown';
	let roleLabel = '未知角色';
	let userPerms: string[] = [];

	if (user && user.roleId) {
		try {
			const [roleRow] = await db
				.select({ name: roles.name, label: roles.label })
				.from(roles)
				.where(eq(roles.id, user.roleId));
			if (roleRow) {
				roleName = roleRow.name;
				roleLabel = roleRow.label;
			}
		} catch {
			// ignore
		}

		try {
			const permRows = await db
				.select({ code: permissions.code })
				.from(rolePermissions)
				.innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
				.where(eq(rolePermissions.roleId, user.roleId));
			userPerms = permRows.map((r) => r.code);
		} catch {
			// ignore
		}
	}

	const enrichedUser = user
		? ({
				...user,
				roleName,
				roleLabel,
				permissions: userPerms
			} as any)
		: null;

	event.locals.user = enrichedUser;
	event.locals.session = session;
	return resolve(event);
};
