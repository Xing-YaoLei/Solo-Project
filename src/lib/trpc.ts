import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '$lib/server/trpc/router';

export const trpc = createTRPCProxyClient<AppRouter>({
	links: [
		httpBatchLink({
			url: '/trpc'
		})
	]
});
