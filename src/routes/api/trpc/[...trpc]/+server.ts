import type { RequestEvent } from '@sveltejs/kit';
import type { AnyRouter } from '@trpc/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createContext } from '$lib/server/trpc/context';
import { appRouter } from '$lib/server/trpc/routers/_app';

export async function GET(event: RequestEvent) {
	return handle(event);
}

export async function POST(event: RequestEvent) {
	return handle(event);
}

async function handle(event: RequestEvent) {
	const response = await fetchRequestHandler({
		endpoint: '/api/trpc',
		req: event.request,
		router: appRouter as AnyRouter,
		createContext: () => createContext(event),
		onError({ error, path }) {
			console.error(`>>> tRPC Error on '${path}'`, error);
		}
	});
	return response;
}
