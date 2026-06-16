import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { RequestHandler } from '@sveltejs/kit';
import { appRouter } from '$server/trpc/routers';
import { createContext } from '$server/trpc/context';

const handler: RequestHandler = async (event) => {
	return fetchRequestHandler({
		endpoint: '/api/trpc',
		req: event.request,
		router: appRouter,
		createContext: () => createContext({ event }),
		onError(opts) {
			console.error('[tRPC Error]', opts.error);
		}
	});
};

export const GET = handler;
export const POST = handler;
