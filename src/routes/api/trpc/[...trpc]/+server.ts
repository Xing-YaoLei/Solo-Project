import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { RequestEvent } from '@sveltejs/kit';
import { appRouter } from '$lib/server/trpc';
import type { Context } from '$lib/server/trpc/t';

async function createContext(event: RequestEvent): Promise<Context> {
  return {
    event,
    user: event.locals.user as any
  };
}

export async function GET(event: RequestEvent) {
  return handleRequest(event);
}

export async function POST(event: RequestEvent) {
  return handleRequest(event);
}

async function handleRequest(event: RequestEvent) {
  const response = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req: event.request,
    router: appRouter,
    createContext: () => createContext(event),
    onError({ error }) {
      console.error('tRPC error:', error);
    }
  });
  return response;
}
