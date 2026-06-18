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
  return response.data;
}
