import { createTRPCProxyClient, httpBatchLink, loggerLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '$lib/server/trpc';

let client: ReturnType<typeof createTRPCProxyClient<AppRouter>> | null = null;

export function getTrpcClient(fetchFn: typeof fetch = fetch) {
  if (!client) {
    client = createTRPCProxyClient<AppRouter>({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error)
        }),
        httpBatchLink({
          url: '/api/trpc',
          fetch: fetchFn,
          transformer: superjson
        })
      ]
    });
  }
  return client;
}

export const trpc = getTrpcClient();
