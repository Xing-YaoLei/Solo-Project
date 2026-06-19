import { auth } from '$lib/server/auth';
import { createTRPCHandle } from 'trpc-sveltekit';
import { rootRouter } from '$lib/server/trpc/router';
import { createContext } from '$lib/server/trpc/context';
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';

const authHandle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(auth.sessionCookieName);

	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const result = await auth.validateSession(sessionId);

	if (result.session && result.session.fresh) {
		const sessionCookie = auth.createSessionCookie(result.session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}

	event.locals.user = result.user;
	event.locals.session = result.session;

	return resolve(event);
};

const trpcHandle = createTRPCHandle({
	router: rootRouter,
	createContext
});

export const handle = sequence(authHandle, trpcHandle);
