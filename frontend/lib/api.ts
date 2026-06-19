import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiError } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || '请求失败',
      code: error.response?.data?.code,
      details: error.response?.data?.details,
    };
    return Promise.reject(apiError);
  }
);

export interface RequestConfig extends AxiosRequestConfig {}

export const apiClient = {
  get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return api.get(url, config);
  },
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return api.post(url, data, config);
  },
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return api.put(url, data, config);
  },
  delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return api.delete(url, config);
  },
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return api.patch(url, data, config);
  },
};

export default apiClient;
