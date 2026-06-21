import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { RequestHandler } from './$types';
import { appRouter } from '$trpc/routes';
import { createContext } from '$trpc/context';

export const GET: RequestHandler = (event) => {
	return fetchRequestHandler({
		endpoint: '/api/rpc',
		req: event.request,
		router: appRouter,
		createContext: () => createContext({ event })
	});
};

export const POST: RequestHandler = (event) => {
	return fetchRequestHandler({
		endpoint: '/api/rpc',
		req: event.request,
		router: appRouter,
		createContext: () => createContext({ event })
	});
};
