import axios from 'axios';
import type { ApiResponse } from '@shared/types';
import { useUserStore } from '@/store/user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse<unknown>;
    if (data.code !== 0 && data.code !== 200) {
      return Promise.reject(new Error(data.message || '请求失败'));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      useUserStore.getState().logout();
    }
    const message =
      error.response?.data?.message ||
      error.message ||
      '网络错误，请稍后重试';
    return Promise.reject(new Error(message));
  }
);

export default api;

function isPaginatedData(data: unknown): data is Record<string, unknown> {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    Array.isArray(d.items) &&
    typeof d.total === 'number' &&
    typeof d.page === 'number' &&
    (typeof d.page_size === 'number' || typeof d.pageSize === 'number')
  );
}

function normalizePaginatedData(data: Record<string, unknown>): Record<string, unknown> {
  const pageSize = (typeof data.page_size === 'number' ? data.page_size : data.pageSize) as number;
  const totalPages = (typeof data.total_pages === 'number'
    ? data.total_pages
    : typeof data.totalPages === 'number'
      ? data.totalPages
      : Math.ceil((data.total as number) / Math.max(pageSize, 1))) as number;
  return {
    ...data,
    pageSize,
    totalPages,
  };
}

function normalizeResponseData<T>(data: T): T {
  if (isPaginatedData(data)) {
    return normalizePaginatedData(data) as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => normalizeResponseData(item)) as T;
  }
  if (data && typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[key] = normalizeResponseData(value);
    }
    return result as T;
  }
  return data;
}

export async function request<T>(config: {
  url: string;
  method?: 'get' | 'post' | 'put' | 'delete' | 'patch';
  params?: Record<string, unknown>;
  data?: unknown;
}): Promise<ApiResponse<T>> {
  const response = await api.request<ApiResponse<T>>({
    url: config.url,
    method: config.method || 'get',
    params: config.params,
    data: config.data,
  });
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    response.data.data = normalizeResponseData(response.data.data);
  }
  return response.data;
}
