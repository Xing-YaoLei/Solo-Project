import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'
import { useAuthStore } from '@/store/auth'

const baseURL = '/api'

const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          message.error('登录已过期，请重新登录')
          useAuthStore.getState().logout()
          window.location.href = '/login'
          break
        case 403:
          message.error('没有权限访问该资源')
          break
        case 404:
          message.error('请求的资源不存在')
          break
        case 500:
          message.error(data?.message || '服务器内部错误')
          break
        default:
          message.error(data?.message || `请求失败: ${status}`)
      }
    } else if (error.request) {
      message.error('网络错误，请检查网络连接')
    } else {
      message.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    axiosInstance.get(url, config),
  
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => 
    axiosInstance.post(url, data, config),
  
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => 
    axiosInstance.put(url, data, config),
  
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    axiosInstance.delete(url, config),
  
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => 
    axiosInstance.patch(url, data, config),
}

export default axiosInstance
