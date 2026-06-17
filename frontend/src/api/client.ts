import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { message } from 'antd'
import { BaseResponse } from '@/types'

const API_BASE_URL = '/api'

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosInstance.interceptors.request.use(
  (config) => {
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

const parseFilenameFromDisposition = (disposition: string | null): string | null => {
  if (!disposition) return null
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      // ignore
    }
  }
  const simpleMatch = disposition.match(/filename="?([^";]+)"?/i)
  if (simpleMatch) {
    return simpleMatch[1]
  }
  return null
}

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    const contentType = String(response.headers?.['content-type'] || '')
    const isBlobRequest = response.config.responseType === 'blob'

    if (isBlobRequest) {
      if (contentType.indexOf('application/json') !== -1) {
        return new Promise((_, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            try {
              const errData = JSON.parse(reader.result as string)
              message.error(errData?.message || errData?.detail || '请求失败')
              reject(new Error(errData?.message || errData?.detail || '请求失败'))
            } catch {
              reject(new Error('导出失败'))
            }
          }
          reader.onerror = () => reject(new Error('读取响应失败'))
          reader.readAsText(response.data as Blob)
        }) as unknown as AxiosResponse
      }
      return response
    }

    const res = response.data as BaseResponse
    if (res.code !== 200 && res.code !== 0) {
      message.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      message.error('登录已过期，请重新登录')
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      message.error('没有权限访问')
    } else if (error.response?.status === 404) {
      message.error('请求的资源不存在')
    } else if (error.response?.status >= 500) {
      message.error('服务器错误，请稍后重试')
    } else if (error.message) {
      message.error(error.message)
    }
    return Promise.reject(error)
  }
)

export interface DownloadResult {
  blob: Blob
  filename: string | null
}

export const request = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.get<BaseResponse<T>>(url, config).then((res) => res.data.data)
  },
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.post<BaseResponse<T>>(url, data, config).then((res) => res.data.data)
  },
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.put<BaseResponse<T>>(url, data, config).then((res) => res.data.data)
  },
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.delete<BaseResponse<T>>(url, config).then((res) => res.data.data)
  },
  download: (url: string, config?: AxiosRequestConfig, method: 'GET' | 'POST' = 'GET', data?: any): Promise<Blob> => {
    const requestConfig: AxiosRequestConfig = {
      ...config,
      url,
      method,
      responseType: 'blob',
    }
    if (data !== undefined && method === 'POST') {
      requestConfig.data = data
    }
    return axiosInstance(requestConfig).then((res) => {
      const disposition = res.headers?.['content-disposition'] || null
      const filename = parseFilenameFromDisposition(disposition)
      const blob = res.data as Blob
      if (filename) {
        try {
          Object.defineProperty(blob, '__filename', { value: filename, writable: false })
        } catch {
          // ignore
        }
      }
      return blob
    })
  },
  downloadWithMeta: (url: string, config?: AxiosRequestConfig, method: 'GET' | 'POST' = 'GET', data?: any): Promise<DownloadResult> => {
    const requestConfig: AxiosRequestConfig = {
      ...config,
      url,
      method,
      responseType: 'blob',
    }
    if (data !== undefined && method === 'POST') {
      requestConfig.data = data
    }
    return axiosInstance(requestConfig).then((res) => {
      const disposition = res.headers?.['content-disposition'] || null
      return {
        blob: res.data as Blob,
        filename: parseFilenameFromDisposition(disposition),
      }
    })
  },
  upload: <T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance
      .post<BaseResponse<T>>(url, formData, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((res) => res.data.data)
  },
}

export default axiosInstance
