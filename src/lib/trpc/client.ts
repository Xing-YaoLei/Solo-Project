import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '$lib/server/trpc/router';
import superjson from 'superjson';

export const trpc = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: '/api/trpc'
    })
  ]
});
