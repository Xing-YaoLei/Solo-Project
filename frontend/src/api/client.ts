import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch'

interface ApiClient {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  request<T = any>(config: AxiosRequestConfig): Promise<T>
  defaults: typeof instance.defaults
  interceptors: typeof instance.interceptors
}

const instance = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

instance.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {}
    config.headers['X-User-Id'] = '1'
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      const message = data?.message || data?.error || `请求错误 (${status})`
      console.error('[API Error]', status, message)
      return Promise.reject(new Error(message))
    } else if (error.request) {
      console.error('[API Error] 网络错误，无响应')
      return Promise.reject(new Error('网络错误，请检查网络连接'))
    } else {
      console.error('[API Error]', error.message)
      return Promise.reject(error)
    }
  }
)

const api = instance as unknown as ApiClient

export default api
