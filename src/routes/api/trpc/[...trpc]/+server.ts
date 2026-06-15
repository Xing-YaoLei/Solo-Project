import type { RequestHandler } from './$types';
import { createContext } from '$server/trpc/context';
import { appRouter } from '$server/trpc';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

export const GET: RequestHandler = async (event) => {
	return fetchRequestHandler({
		endpoint: '/api/trpc',
		req: event.request,
		router: appRouter,
		createContext: () => createContext(event)
	});
};

export const POST: RequestHandler = async (event) => {
	return fetchRequestHandler({
		endpoint: '/api/trpc',
		req: event.request,
		router: appRouter,
		createContext: () => createContext(event)
	});
};
