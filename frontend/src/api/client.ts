import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { router } from '@/router'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('audit_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname + window.location.search
      localStorage.removeItem('audit_token')
      localStorage.removeItem('audit_user')
      if (currentPath !== '/login') {
        router.navigate({
          to: '/login',
          search: { redirect: currentPath },
          replace: true,
        })
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
