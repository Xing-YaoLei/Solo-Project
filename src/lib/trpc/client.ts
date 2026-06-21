import { createTRPCProxyClient, httpBatchLink, loggerLink } from '@trpc/client';
import type { AppRouter } from './routes';
import { browser } from '$app/environment';

let client: ReturnType<typeof createTRPCProxyClient<AppRouter>> | null = null;

export function getClient() {
	if (client) return client;

	client = createTRPCProxyClient<AppRouter>({
		links: [
			loggerLink({
				enabled: (opts) =>
					import.meta.env.DEV ||
					(opts.direction === 'down' && opts.result instanceof Error)
			}),
			httpBatchLink({
				url: '/api/rpc',
				fetch(url, options) {
					return fetch(url, {
						...options,
						credentials: 'include'
					});
				}
			})
		]
	});

	return client;
}

export const trpc = getClient();
