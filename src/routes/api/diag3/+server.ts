import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  const results: Record<string, any> = {};
  
  try {
    const mod = await import('$lib/stores/auth');
    results['stores/auth'] = { ok: true };
  } catch (e: any) { results['stores/auth'] = { ok: false, err: e?.message }; }

  try {
    const mod = await import('lucide-svelte');
    results['lucide-svelte'] = { ok: true };
  } catch (e: any) { results['lucide-svelte'] = { ok: false, err: e?.message }; }

  try {
    const mod = await import('$app/navigation');
    results['app/navigation'] = { ok: true };
  } catch (e: any) { results['app/navigation'] = { ok: false, err: e?.message }; }

  try {
    const mod = await import('$lib/trpc/client');
    results['trpc/client'] = { ok: true };
  } catch (e: any) { results['trpc/client'] = { ok: false, err: e?.message }; }

  try {
    const mod = await import('$shared/types');
    results['shared/types'] = { ok: true };
  } catch (e: any) { results['shared/types'] = { ok: false, err: e?.message }; }

  return json(results);
};
