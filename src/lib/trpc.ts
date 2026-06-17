import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '$server/trpc/root';
import { page } from '$app/stores';
import { get } from 'svelte/store';
import { browser } from '$app/environment';

function getBaseUrl() {
	if (browser) return '';
	return '';
}

export const trpc = createTRPCProxyClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${getBaseUrl()}/api/trpc`,
			fetch: (input, init) => fetch(input, init)
		})
	]
});
