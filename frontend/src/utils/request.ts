import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { ApiResponse } from '../types';

const TOKEN_KEY = 'auth_token';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

const request: AxiosInstance = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL || ''}/api/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data;

    if (data && typeof data === 'object' && 'code' in data) {
      const { code, message: msg, data: responseData } = data as unknown as ApiResponse;

      if (code === 200 || code === 0) {
        return responseData;
      }

      if (code === 401) {
        removeToken();
        message.error('登录已过期，请重新登录');
        window.location.href = '/login';
        return Promise.reject(new Error('Unauthorized'));
      }

      if (code === 403) {
        message.error('没有权限访问该资源');
        return Promise.reject(new Error('Forbidden'));
      }

      if (msg) {
        message.error(msg);
      }

      return Promise.reject(new Error(msg || 'Request failed'));
    }

    return data;
  },
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      message.error('登录已过期，请重新登录');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      message.error('没有权限访问该资源');
    } else if (error.response?.status === 404) {
      message.error('请求的资源不存在');
    } else if (error.response?.status >= 500) {
      message.error('服务器错误，请稍后重试');
    } else if (error.message === 'Network Error') {
      message.error('网络连接失败，请检查网络');
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请稍后重试');
    } else {
      message.error(error.message || '请求失败');
    }

    return Promise.reject(error);
  }
);

export default request;
