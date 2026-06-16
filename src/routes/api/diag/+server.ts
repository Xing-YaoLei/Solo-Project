import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  try {
    const mod = await import('$lib/trpc/client');
    return json({ success: true, exports: Object.keys(mod) });
  } catch (err: any) {
    return json({
      error: err?.message || String(err),
      stack: err?.stack?.split('\n')?.slice(0, 10)
    }, { status: 500 });
  }
};
