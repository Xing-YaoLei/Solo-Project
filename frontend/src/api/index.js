import axios from 'axios';
import { message } from 'antd';
const API_BASE = '/api/v1';
export const axiosInstance = axios.create({
    baseURL: API_BASE,
    timeout: 60000,
});
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));
axiosInstance.interceptors.response.use((response) => response, (error) => {
    const status = error?.response?.status;
    const msg = error?.response?.data?.detail || error.message || '请求失败';
    if (status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('current_user');
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
    }
    else if (status === 403) {
        message.error('权限不足: ' + msg);
    }
    else {
        message.error(msg);
    }
    return Promise.reject(error);
});
export default axiosInstance;
export const api = {
    get: (url, params) => axiosInstance.get(url, { params }),
    post: (url, data, config) => axiosInstance.post(url, data, config),
    put: (url, data) => axiosInstance.put(url, data),
    delete: (url) => axiosInstance.delete(url),
    upload: (url, formData) => axiosInstance.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
