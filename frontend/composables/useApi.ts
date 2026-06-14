import axios from 'axios'

export const useApi = () => {
  const config = useRuntimeConfig()

  const api = axios.create({
    baseURL: config.public.apiBase,
    timeout: 30000,
  })

  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access_token')
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
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        navigateTo('/login')
      }
      return Promise.reject(error)
    }
  )

  return api
}
