import { createTRPCClient, type TRPCClientInit } from 'trpc-sveltekit';
import superjson from 'superjson';
import type { AppRouter } from '../server/routers';

let browserClient: ReturnType<typeof createTRPCClient<AppRouter>>;

export function trpc(init?: TRPCClientInit) {
	const isBrowser = typeof window !== 'undefined';
	if (isBrowser && browserClient) return browserClient;
	const client = createTRPCClient<AppRouter>({
		transformer: superjson,
		url: '/api/trpc',
		init
	});
	if (isBrowser) browserClient = client;
	return client;
}
