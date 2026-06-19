import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '$server/trpc/router';
import { createContext } from '$server/trpc/context';
import type { RequestHandler } from '@sveltejs/kit';

const handler: RequestHandler = (event) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: event.request,
    router: appRouter,
    createContext: () => createContext(event),
    onError: ({ error }) => {
      console.error('tRPC Error:', error);
    }
  });
};

export const GET = handler;
export const POST = handler;
