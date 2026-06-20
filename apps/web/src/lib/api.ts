const BASE = '/api';

async function request<T = any>(method: string, url: string, body?: any, query?: Record<string, any>): Promise<T> {
  const qs = query
    ? '?' + new URLSearchParams(
        Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '')),
      ).toString()
    : '';
  const resp = await fetch(BASE + url + qs, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `请求失败 ${resp.status}`);
  }
  const ct = resp.headers.get('content-type') || '';
  if (ct.includes('application/json')) return resp.json();
  return resp.text() as any;
}

export const api = {
  get: <T = any>(url: string, query?: Record<string, any>) => request<T>('GET', url, undefined, query),
  post: <T = any>(url: string, body?: any, query?: Record<string, any>) => request<T>('POST', url, body, query),
  put: <T = any>(url: string, body?: any, query?: Record<string, any>) => request<T>('PUT', url, body, query),
  del: <T = any>(url: string, query?: Record<string, any>) => request<T>('DELETE', url, undefined, query),
};
