import { createContext } from '$server/trpc/context';
import { appRouter } from '$server/trpc';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { RequestEvent } from '@sveltejs/kit';

async function handler(event: RequestEvent) {
	return fetchRequestHandler({
		endpoint: '/trpc',
		req: event.request,
		router: appRouter,
		// @ts-ignore
		createContext: () => createContext(event as any),
		responseMeta(opts) {
			const { ctx, paths, errors } = opts;
			return {};
		}
	});
}

export const GET = (event: RequestEvent) => handler(event);
export const POST = (event: RequestEvent) => handler(event);
