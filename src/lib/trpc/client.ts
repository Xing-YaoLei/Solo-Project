import { createTRPCProxyClient, loggerLink, httpLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '$server/trpc';

const getBaseUrl = () => {
	if (typeof window !== 'undefined') return '';
	return import.meta.env.VITE_APP_URL ?? 'http://localhost:5173';
};

export const trpcClient = createTRPCProxyClient<AppRouter>({
	transformer: superjson,
	links: [
		loggerLink({
			enabled: (opts) =>
				import.meta.env.DEV &&
				typeof window !== 'undefined'
		}),
		httpLink({
			url: `${getBaseUrl()}/trpc`,
			fetch(url, options) {
				return fetch(url, {
					...options,
					credentials: 'include'
				});
			}
		})
	]
});
