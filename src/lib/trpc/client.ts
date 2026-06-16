import { createTRPCClient, httpLink, type TRPCClientInit } from '@trpc/client';
import type { AppRouter } from '$server/trpc/routers';

let browserClient: ReturnType<typeof createTRPCClient<AppRouter>> | null = null;

function getToken(): string | null {
	if (typeof window === 'undefined') return null;
	try {
		return localStorage.getItem('eldercare_token');
	} catch {
		return null;
	}
}

export function createTRPCProxyClient(init?: TRPCClientInit) {
	const isBrowser = typeof window !== 'undefined';
	if (isBrowser && browserClient) return browserClient;

	const client = createTRPCClient<AppRouter>({
		links: [
			httpLink({
				url: '/api/trpc',
				async fetch(url, options) {
					const token = getToken();
					const headers = new Headers(options?.headers ?? {});
					if (token) {
						headers.set('Authorization', `Bearer ${token}`);
					}
					headers.set('Content-Type', 'application/json');
					return fetch(url, {
						...options,
						headers,
						credentials: 'include'
					});
				}
			})
		]
	});

	if (isBrowser) browserClient = client;
	return client;
}

export function resetTRPCClient() {
	browserClient = null;
}

export type TRPCClient = ReturnType<typeof createTRPCProxyClient>;
