import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  try {
    const { appRouter } = await import('$server/trpc/routers');
    const caller = appRouter.createCaller({} as any);
    const result = await caller.auth.logout();
    return json({ success: true, result });
  } catch (err: any) {
    return json({
      error: err?.message || String(err),
      stack: err?.stack?.split('\n')?.slice(0, 5)
    }, { status: 500 });
  }
};
