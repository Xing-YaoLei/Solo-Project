import { createTRPCProxyClient, httpBatchLink, loggerLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '$lib/server/trpc/routers/_app';

export const trpc = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    loggerLink({
      enabled: (opts) =>
        import.meta.env.DEV ||
        (opts.direction === 'down' && opts.result instanceof Error)
    }),
    httpBatchLink({
      url: '/api/trpc'
    })
  ]
}) as any;
