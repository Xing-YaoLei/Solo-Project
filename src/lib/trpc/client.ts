import { createTRPCProxyClient, httpBatchLink, loggerLink } from '@trpc/client';
import type { AppRouter } from '$lib/server/trpc/router';
import superjson from 'superjson';
import { browser } from '$app/environment';

export function createTRPCClient() {
	return createTRPCProxyClient<AppRouter>({
		transformer: superjson,
		links: [
			loggerLink({
				enabled: () => browser && process.env.NODE_ENV === 'development'
			}),
			httpBatchLink({
				url: '/trpc',
				fetch: (url, options) => fetch(url, { ...options, credentials: 'include' })
			})
		]
	});
}

export const trpc = createTRPCClient();
