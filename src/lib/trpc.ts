import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '$lib/server/trpc/root';

let client: ReturnType<typeof createTRPCProxyClient<AppRouter>> | null = null;

export function getTrpcClient() {
	if (client) return client;

	client = createTRPCProxyClient<AppRouter>({
		links: [
			httpBatchLink({
				url: '/api/trpc'
			})
		]
	});

	return client;
}
