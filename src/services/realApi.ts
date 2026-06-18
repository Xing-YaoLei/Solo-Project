import { httpClient } from './http';

const snakeToCamel = (s: string): string =>
  s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const camelToSnake = (s: string): string =>
  s.replace(/[A-Z]/g, c => '_' + c.toLowerCase());

export function transformKeys<T = any>(obj: any, fn: (s: string) => string): T {
  if (obj === null || obj === undefined) return obj as T;
  if (Array.isArray(obj)) return obj.map(x => transformKeys(x, fn)) as any;
  if (typeof obj !== 'object') return obj as T;
  const out: any = {};
  for (const k of Object.keys(obj)) {
    out[fn(k)] = transformKeys(obj[k], fn);
  }
  return out as T;
}

export const toCamel = <T = any>(o: any): T => transformKeys<T>(o, snakeToCamel);
export const toSnake = <T = any>(o: any): T => transformKeys<T>(o, camelToSnake);

interface BackendPaginated<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export function paginatedAdapter<T>(
  backendData: BackendPaginated<any>
): { items: T[]; total: number; page: number; pageSize: number } {
  return {
    items: (backendData?.data || []).map(x => toCamel<T>(x)),
    total: backendData?.total ?? 0,
    page: backendData?.page ?? 1,
    pageSize: backendData?.page_size ?? 10,
  };
}

export const realApi = {
  get: <T>(endpoint: string, params?: Record<string, any>) =>
    httpClient.get<any>(endpoint, params ? toSnake(params) : undefined).then(r => toCamel<T>(r)),

  getList: <T>(endpoint: string, params?: Record<string, any>) =>
    httpClient.get<any>(endpoint, params ? toSnake(params) : undefined).then(r => paginatedAdapter<T>(r)),

  getArray: <T>(endpoint: string, params?: Record<string, any>) =>
    httpClient.get<any[]>(endpoint, params ? toSnake(params) : undefined).then(arr =>
      (arr || []).map(x => toCamel<T>(x))
    ),

  post: <T>(endpoint: string, data?: any) =>
    httpClient.post<any>(endpoint, data ? toSnake(data) : undefined).then(r => toCamel<T>(r)),

  put: <T>(endpoint: string, data?: any) =>
    httpClient.put<any>(endpoint, data ? toSnake(data) : undefined).then(r => toCamel<T>(r)),

  delete: <T>(endpoint: string) =>
    httpClient.delete<any>(endpoint).then(r => toCamel<T>(r)),
};
