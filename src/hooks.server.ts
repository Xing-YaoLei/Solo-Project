import { lucia } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { createTRPCHandle } from 'trpc-sveltekit';
import { createContext } from '$lib/server/trpc/context';
import { appRouter as router } from '$lib/server/trpc/router';

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

	event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};

const trpcHandle = createTRPCHandle({
	router,
	createContext,
	responseMeta({ ctx, paths, type, errors }) {
		return {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Request-Method': '*',
				'Access-Control-Allow-Methods': 'OPTIONS, GET, POST',
				'Access-Control-Allow-Headers': '*'
			}
		};
	}
});

export const handle: Handle = sequence(authHandle, trpcHandle);
