import superjson from 'superjson';
import { httpBatchLink, createTRPCProxyClient } from '@trpc/client';
import type { AppRouter } from './routers';
import { browser } from '$app/environment';

export const trpc = createTRPCProxyClient<AppRouter>({
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

export function createTRPCClient(fetchFn: typeof fetch = browser ? fetch : globalThis.fetch) {
	return createTRPCProxyClient<AppRouter>({
		transformer: superjson,
		links: [
			httpBatchLink({
				url: '/api/trpc',
				fetch: fetchFn
			})
		]
	});
}
