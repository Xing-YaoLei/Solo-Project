import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'
import type { ApiResponse } from '@/types'

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.config.responseType === 'blob') {
      return response
    }
    const res = response.data
    if (res && typeof res === 'object' && 'success' in res) {
      if (res.success) {
        return response
      } else {
        message.error(res.message || '请求失败')
        return Promise.reject(new Error(res.message || '请求失败'))
      }
    }
    response.data = { success: true, data: res } as ApiResponse<unknown>
    return response
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message.error('未授权，请重新登录')
          localStorage.removeItem('token')
          break
        case 403:
          message.error('没有权限访问')
          break
        case 404:
          message.error('请求的资源不存在')
          break
        case 500:
          message.error('服务器内部错误')
          break
        default:
          message.error(error.response.data?.message || `请求错误: ${error.response.status}`)
      }
    } else if (error.request) {
      message.error('网络错误，请检查网络连接')
    } else {
      message.error('请求配置错误')
    }
    return Promise.reject(error)
  }
)

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await request.get<ApiResponse<T>>(url, config)
  return (response.data as ApiResponse<T>).data
}

export async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await request.post<ApiResponse<T>>(url, data, config)
  return (response.data as ApiResponse<T>).data
}

export async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await request.put<ApiResponse<T>>(url, data, config)
  return (response.data as ApiResponse<T>).data
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await request.delete<ApiResponse<T>>(url, config)
  return (response.data as ApiResponse<T>).data
}

export async function download(url: string, params?: Record<string, unknown>, filename?: string): Promise<void> {
  const response = await request.get(url, {
    params,
    responseType: 'blob',
  })
  const blob = new Blob([response.data])
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename || `export_${Date.now()}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

export default request
