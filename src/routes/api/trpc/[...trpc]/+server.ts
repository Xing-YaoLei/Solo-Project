import { createTRPCContext } from '$lib/server/trpc/trpc';
import { appRouter } from '$lib/server/trpc/root';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { RequestHandler } from '@sveltejs/kit';

function createContext(event: any) {
	return createTRPCContext({
		user: event.locals.user,
		sessionId: event.locals.session?.id ?? null
	});
}

export const GET = (async (event) => {
	return fetchRequestHandler({
		endpoint: '/api/trpc',
		req: event.request,
		router: appRouter,
		createContext: () => createContext(event)
	});
}) satisfies RequestHandler;

export const POST = (async (event) => {
	return fetchRequestHandler({
		endpoint: '/api/trpc',
		req: event.request,
		router: appRouter,
		createContext: () => createContext(event)
	});
}) satisfies RequestHandler;
