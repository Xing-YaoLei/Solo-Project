import axios from 'axios'
import { message } from 'antd'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data.code === 0) {
      return data.data
    } else {
      message.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
  },
  (error) => {
    if (error.response?.status === 404) {
      message.error('资源不存在')
    } else if (error.response?.status === 500) {
      message.error('服务器错误')
    } else if (error.message.includes('timeout')) {
      message.error('请求超时')
    } else {
      message.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  },
)

export interface PageResult<T> {
  total: number
  page: number
  page_size: number
  list: T[]
}

export default api
