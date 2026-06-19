import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { auth } from '$lib/server/auth';

export const load = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, '/');
	}
};

export const actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username') as string;
		const displayName = formData.get('displayName') as string;
		const password = formData.get('password') as string;

		if (!username || !password) {
			return fail(400, { message: '请输入用户名和密码' });
		}

		const [existingUser] = await db
			.select()
			.from(user)
			.where(eq(user.username, username));

		if (existingUser) {
			return fail(400, { message: '用户名已存在' });
		}

		const passwordHash = password;
		const userId = crypto.randomUUID();

		await db.insert(user).values({
			id: userId,
			username,
			password_hash: passwordHash,
			display_name: displayName || username,
			role: 'staff'
		});

		const session = await auth.createSession(userId, {});
		const sessionCookie = auth.createSessionCookie(session.id);

		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		throw redirect(302, '/');
	}
};
