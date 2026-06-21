import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    const res = response.data;
    if (res.code !== 200) {
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  },
);

export async function get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  const response = await request.get<ApiResponse<T>>(url, { params, ...config });
  return response.data;
}

export async function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  const response = await request.post<ApiResponse<T>>(url, data, config);
  return response.data;
}

export async function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  const response = await request.put<ApiResponse<T>>(url, data, config);
  return response.data;
}

export async function patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  const response = await request.patch<ApiResponse<T>>(url, data, config);
  return response.data;
}

export async function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  const response = await request.delete<ApiResponse<T>>(url, config);
  return response.data;
}

export async function download(url: string, params?: any, filename?: string) {
  const response = await request.get(url, {
    params,
    responseType: 'blob',
  });
  const blob = new Blob([response.data as any], {
    type: response.headers['content-type'] || 'application/octet-stream',
  });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename || 'download.xlsx';
  link.click();
  window.URL.revokeObjectURL(link.href);
}

export default request;
