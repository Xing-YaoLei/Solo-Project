import { redirect, fail, type Actions } from '@sveltejs/kit';
import { MOCK_USERS, MOCK_COOKIE_NAME } from '../../hooks.server';
import { dev } from '$app/environment';

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const username = String(formData.get('username') ?? '').trim();
		const password = String(formData.get('password') ?? '').trim();

		if (!username || !password) {
			return fail(400, { username, error: '请输入用户名和密码' });
		}

		const mock = MOCK_USERS[username];
		if (mock && mock.password === password) {
			const sessionPayload = Buffer.from(
				JSON.stringify({ username, ts: Date.now() })
			).toString('base64');
			event.cookies.set(MOCK_COOKIE_NAME, sessionPayload, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: !dev,
				maxAge: 60 * 60 * 24 * 7
			});
			throw redirect(302, '/');
		}

		try {
			const { verifyPassword } = await import('$lib/server/auth/hash');
			const { db, schema, eq } = await import('$lib/server/db/index').then(async (mod) => {
				const { eq } = await import('drizzle-orm');
				return { ...mod, eq };
			});
			const found = await db.query.users.findFirst({
				where: eq(schema.users.username, username)
			});
			if (found && (await verifyPassword(found.passwordHash, password))) {
				const { lucia } = await import('$lib/server/auth/lucia');
				const session = await lucia.createSession(found.id, {});
				const sessionCookie = lucia.createSessionCookie(session.id);
				event.cookies.set(sessionCookie.name, sessionCookie.value, {
					path: '.',
					...sessionCookie.attributes
				});
				throw redirect(302, '/');
			}
		} catch (e: any) {
			if (e.status === 302) throw e;
		}

		return fail(401, { username, error: '用户名或密码错误' });
	}
};
