import type { Handle } from '@sveltejs/kit';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './routes';
import { createContext } from './context';

export const trpcHandle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/api/rpc')) {
		return fetchRequestHandler({
			endpoint: '/api/rpc',
			req: event.request,
			router: appRouter,
			createContext: () => createContext(event)
		});
	}
	return resolve(event);
};
