import type { Handle } from '@sveltejs/kit';

const MOCK_USERS: Record<string, { password: string; user: any }> = {
	admin: {
		password: 'admin123',
		user: {
			id: 'mock-admin-id',
			username: 'admin',
			name: '张厂长',
			role: 'MANAGER'
		}
	},
	advisor: {
		password: 'test123',
		user: {
			id: 'mock-advisor-id',
			username: 'advisor',
			name: '李顾问',
			role: 'ADVISOR'
		}
	},
	technician: {
		password: 'test123',
		user: {
			id: 'mock-technician-id',
			username: 'technician',
			name: '王技师',
			role: 'TECHNICIAN'
		}
	},
	parts: {
		password: 'test123',
		user: {
			id: 'mock-parts-id',
			username: 'parts',
			name: '赵配件',
			role: 'PARTS'
		}
	}
};

const MOCK_COOKIE_NAME = 'auth_mock_session';

export const handle: Handle = async ({ event, resolve }) => {
	const mockSession = event.cookies.get(MOCK_COOKIE_NAME);

	if (mockSession) {
		try {
			const parsed = JSON.parse(Buffer.from(mockSession, 'base64').toString());
			const mock = MOCK_USERS[parsed.username];
			if (mock) {
				event.locals.user = mock.user;
				event.locals.session = {
					id: 'mock-session',
					userId: mock.user.id,
					expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
					fresh: false
				};
				return resolve(event);
			}
		} catch (e) {
			event.cookies.delete(MOCK_COOKIE_NAME, { path: '/' });
		}
	}

	try {
		const { lucia } = await import('$lib/server/auth/lucia');
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
				path: '.',
				...sessionCookie.attributes
			});
		}
		if (!session) {
			const sessionCookie = lucia.createBlankSessionCookie();
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});
		}
		event.locals.user = user;
		event.locals.session = session;
	} catch (e) {
		event.locals.user = null;
		event.locals.session = null;
	}

	return resolve(event);
};

export { MOCK_USERS, MOCK_COOKIE_NAME };
