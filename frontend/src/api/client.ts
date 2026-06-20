import axios from 'axios'

const isNetworkError = (err: unknown): boolean => {
  if (!axios.isAxiosError(err)) return false
  const code = err.code || ''
  const status = err.response?.status ?? 0
  return (
    code === 'ECONNREFUSED' ||
    code === 'ECONNRESET' ||
    code === 'ERR_NETWORK' ||
    status === 502 ||
    status === 503 ||
    !err.response
  )
}

export const API_CLIENT_ERROR = Symbol.for('API_CLIENT_ERROR')

const client = axios.create({
  baseURL: '/api',
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isNetworkError(error)) {
      Object.assign(error, { [API_CLIENT_ERROR]: 'no-backend' })
    } else {
      const message = error.response?.data?.detail || error.message || '请求失败'
      console.error('[API Error]', message)
    }
    return Promise.reject(error)
  },
)

export function isBackendUnavailable(err: unknown): boolean {
  return Boolean(err && (err as any)[API_CLIENT_ERROR] === 'no-backend')
}

export default client
