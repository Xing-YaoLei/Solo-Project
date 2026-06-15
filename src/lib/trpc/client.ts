import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '$server/trpc';

let client: ReturnType<typeof createTRPCProxyClient<AppRouter>> | null = null;

export function getTrpcClient() {
	if (!client) {
		client = createTRPCProxyClient<AppRouter>({
			links: [
				httpBatchLink({
					url: '/api/trpc',
					fetch: (url, options) => {
						return fetch(url, {
							...options,
							credentials: 'include'
						});
					}
				})
			]
		});
	}
	return client;
}

export { client as trpcClient };
