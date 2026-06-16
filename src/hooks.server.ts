import type { Handle } from '@sveltejs/kit';
import { createContext } from '$server/trpc/context';

export const handle: Handle = async ({ event, resolve }) => {
  const ctx = await createContext({ event });
  event.locals.user = ctx.user;

  const response = await resolve(event);
  return response;
};
