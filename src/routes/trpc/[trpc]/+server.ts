import { createTRPCHandle } from 'trpc-sveltekit';
import { rootRouter } from '$lib/server/trpc/router';
import { createContext } from '$lib/server/trpc/context';
import type { RequestEvent } from '@sveltejs/kit';

const handle = createTRPCHandle({
	router: rootRouter,
	createContext
});

export const GET = (event: RequestEvent) =>
	handle({
		event,
		resolve: async () => new Response(null, { status: 404 })
	});

export const POST = (event: RequestEvent) =>
	handle({
		event,
		resolve: async () => new Response(null, { status: 404 })
	});
