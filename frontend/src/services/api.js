import axios from 'axios'
import { message } from 'antd'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    if (error.response?.data?.detail) {
      message.error(error.response.data.detail)
    } else if (error.message) {
      message.error(error.message)
    }
    return Promise.reject(error)
  }
)

export default api
