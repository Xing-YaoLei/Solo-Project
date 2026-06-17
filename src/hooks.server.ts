import { handleTRPC } from '$server/trpc/handler';
import { lucia } from '$server/auth';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

const authHandle: Handle = async ({ event, resolve }) => {
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

	event.locals.user = user ? {
		id: user.id,
		username: user.username,
		displayName: user.displayName,
		role: user.role
	} : null;
	event.locals.session = session;

	return resolve(event);
};

const guardHandle: Handle = async ({ event, resolve }) => {
	const protectedRoutes = ['/', '/inspection', '/contracts', '/utilities', '/work-orders', '/approvals', '/archives', '/dashboard'];
	const isProtected = protectedRoutes.some(route => event.url.pathname === route || event.url.pathname.startsWith(route + '/'));

	if (isProtected && !event.locals.user) {
		return new Response(null, {
			status: 302,
			headers: { Location: '/login' }
		});
	}

	if (event.url.pathname === '/login' && event.locals.user) {
		return new Response(null, {
			status: 302,
			headers: { Location: '/' }
		});
	}

	return resolve(event);
};

export const handle = sequence(authHandle, guardHandle, handleTRPC as any);
