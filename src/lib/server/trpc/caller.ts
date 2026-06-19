import type { RequestEvent } from '@sveltejs/kit';
import { createContext } from './context';

export async function createCaller(event: RequestEvent) {
  const context = await createContext(event);
  const { appRouter } = await import('./router');
  return appRouter.createCaller(context);
}
