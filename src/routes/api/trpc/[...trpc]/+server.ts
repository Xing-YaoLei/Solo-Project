import { createTRPCContext } from '$lib/server/trpc/trpc';
import { appRouter } from '$lib/server/trpc/root';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { RequestHandler } from '@sveltejs/kit';

export const GET = (async (event) => {
	return fetchRequestHandler({
		endpoint: '/api/trpc',
		req: event.request,
		router: appRouter,
		createContext: () =>
			createTRPCContext({
				user: event.locals.user
			}),
		onError({ error, path }) {
			console.error(`>>> tRPC Error on '${path}'`, error);
		}
	});
}) satisfies RequestHandler;

export const POST = (async (event) => {
	return fetchRequestHandler({
		endpoint: '/api/trpc',
		req: event.request,
		router: appRouter,
		createContext: () =>
			createTRPCContext({
				user: event.locals.user
			}),
		onError({ error, path }) {
			console.error(`>>> tRPC Error on '${path}'`, error);
		}
	});
}) satisfies RequestHandler;
