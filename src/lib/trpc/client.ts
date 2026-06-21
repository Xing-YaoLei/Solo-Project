import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '$lib/server/trpc/router';
import { browser } from '$app/environment';

export function createClient() {
	return createTRPCProxyClient<AppRouter>({
		transformer: superjson,
		links: [
			httpBatchLink({
				url: '/api/trpc',
				fetch(url, options) {
					return fetch(url, {
						...options,
						credentials: 'include'
					});
				}
			})
		]
	});
}

export type TRPCClient = ReturnType<typeof createClient>;
