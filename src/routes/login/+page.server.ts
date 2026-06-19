import { lucia } from '$server/auth';
import { db } from '$server/db';
import { users } from '$server/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '$server/auth/password';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(302, '/');
  }
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const username = formData.get('username')?.toString();
    const password = formData.get('password')?.toString();

    if (!username || !password) {
      return fail(400, { error: '请输入用户名和密码' });
    }

    const [user] = await db.select().from(users).where(eq(users.username, username));

    if (!user) {
      return fail(401, { error: '用户名或密码错误' });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return fail(401, { error: '用户名或密码错误' });
    }

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '/',
      ...sessionCookie.attributes
    });

    throw redirect(302, '/');
  }
};
