import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';

const API_BASE = '/api/v1';

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const status = error?.response?.status;
    const msg = error?.response?.data?.detail || error.message || '请求失败';
    if (status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('current_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (status === 403) {
      message.error('权限不足: ' + msg);
    } else {
      message.error(msg);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

export const api = {
  get: <T = any>(url: string, params?: any) => axiosInstance.get<T>(url, { params }),
  post: <T = any>(url: string, data?: any, config?: any) => axiosInstance.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any) => axiosInstance.put<T>(url, data),
  delete: <T = any>(url: string) => axiosInstance.delete<T>(url),
  upload: <T = any>(url: string, formData: FormData) =>
    axiosInstance.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
