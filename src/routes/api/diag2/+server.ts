import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  const results: Record<string, any> = {};
  
  const tests = [
    'lib/stores/auth',
    'lib/trpc/client',
    'lib/components/AppShell.svelte',
  ];
  
  for (const t of tests) {
    try {
      const mod = await import(`$${t}`);
      results[t] = { ok: true, keys: Object.keys(mod).slice(0, 10) };
    } catch (err: any) {
      results[t] = { ok: false, error: err?.message || String(err) };
    }
  }
  
  return json(results);
};
