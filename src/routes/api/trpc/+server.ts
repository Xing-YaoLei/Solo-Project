import type { RequestHandler } from './$types';
import { createTRPCContext } from '$lib/server/trpc/context';
import { appRouter } from '$lib/server/trpc/router';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

export const GET: RequestHandler = (event) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: event.request,
    router: appRouter,
    createContext: () => createTRPCContext(event)
  });
};

export const POST: RequestHandler = (event) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: event.request,
    router: appRouter,
    createContext: () => createTRPCContext(event)
  });
};
