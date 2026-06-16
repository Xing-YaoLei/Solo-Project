import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  try {
    const { createContext } = await import('$server/trpc/context');
    const ctx = await createContext({});
    return json({
      success: true,
      hasUser: !!ctx.user,
      isMockDb: ctx.isMockDb
    });
  } catch (err: any) {
    return json({
      error: err?.message || String(err),
      stack: err?.stack?.split('\n')?.slice(0, 10)
    }, { status: 500 });
  }
};
