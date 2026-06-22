import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const authStorageRaw = localStorage.getItem('auth-storage');
      if (authStorageRaw) {
        try {
          const authStorage = JSON.parse(authStorageRaw);
          if (authStorage.state?.token) {
            config.headers.Authorization = `Bearer ${authStorage.state.token}`;
          }
        } catch (e) { /* ignore */ }
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_info');
          localStorage.removeItem('auth-storage');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      }

      if (status === 403) {
        if (typeof window !== 'undefined') {
          window.location.href = '/403';
        }
      }

      const data = error.response.data as { message?: string };
      const errorMessage =
        data?.message ||
        (status === 400
          ? '请求参数错误'
          : status === 401
          ? '登录已过期，请重新登录'
          : status === 403
          ? '没有权限访问该资源'
          : status === 404
          ? '请求的资源不存在'
          : status === 500
          ? '服务器内部错误'
          : '请求失败，请稍后重试');

      return Promise.reject(new Error(errorMessage));
    }

    if (error.request) {
      return Promise.reject(new Error('网络连接失败，请检查网络'));
    }

    return Promise.reject(new Error('请求发生错误'));
  },
);

export default apiClient;
