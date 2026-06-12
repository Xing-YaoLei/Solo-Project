import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '$lib/server/trpc/root';

let client: ReturnType<typeof createTRPCProxyClient<AppRouter>> | null = null;

export function getTrpcClient() {
	if (client) return client;

	client = createTRPCProxyClient<AppRouter>({
		transformer: superjson,
		links: [
			httpBatchLink({
				url: '/api/trpc'
			})
		]
	});

	return client;
}
