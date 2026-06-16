import type { RequestHandler } from './$types';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '$lib/server/trpc/routers/_app';
import { createTRPCContext } from '$lib/server/trpc/trpc';
import { dev } from '$app/environment';

export const POST: RequestHandler = (event) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: event.request,
    router: appRouter,
    createContext: () => createTRPCContext(event),
    onError:
      dev
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
            );
          }
        : undefined
  });
};
