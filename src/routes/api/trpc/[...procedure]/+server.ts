import type { RequestHandler } from './$types';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '$lib/trpc/routers';
import { createTRPCContext } from '$lib/trpc/server';

export const GET: RequestHandler = (event) => {
	return fetchRequestHandler({
		endpoint: '/api/trpc',
		req: event.request,
		router: appRouter,
		createContext: () => createTRPCContext(event),
		onError({ path, error }) {
			console.error(`tRPC 请求错误 [${path}]:`, error);
		}
	});
};

export const POST: RequestHandler = (event) => {
	return fetchRequestHandler({
		endpoint: '/api/trpc',
		req: event.request,
		router: appRouter,
		createContext: () => createTRPCContext(event),
		onError({ path, error }) {
			console.error(`tRPC 请求错误 [${path}]:`, error);
		}
	});
};
