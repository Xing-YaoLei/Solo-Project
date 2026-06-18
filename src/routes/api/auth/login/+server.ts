import { json, type RequestHandler } from '@sveltejs/kit';
import { findUserByCredentials, hashPassword } from '$lib/server/repositories/userRepository';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json();
		const { username, password } = body;

		if (!username || !password) {
			return json({ error: '用户名和密码不能为空' }, { status: 400 });
		}

		const user = findUserByCredentials(username, hashPassword(password));
		if (!user) {
			return json({ error: '用户名或密码错误' }, { status: 401 });
		}

		cookies.set('user_id', user.id, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});

		return json({ user });
	} catch (e) {
		return json({ error: '登录失败' }, { status: 500 });
	}
};
