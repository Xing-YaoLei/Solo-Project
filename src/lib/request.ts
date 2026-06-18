export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
  timestamp: string
  traceId?: string
}

export interface RequestConfig extends RequestInit {
  params?: Record<string, unknown>
  timeout?: number
  skipAuth?: boolean
  shareToken?: string
  retries?: number
}

export class ApiError extends Error {
  code: number
  data?: unknown
  timestamp: string
  traceId?: string

  constructor(message: string, code: number, data?: unknown, traceId?: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.data = data
    this.timestamp = new Date().toISOString()
    this.traceId = traceId
  }
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const DEFAULT_TIMEOUT = Number(import.meta.env.VITE_REQUEST_TIMEOUT) || 30000
const MAX_RETRIES = 2

const TOKEN_KEY = 'dashboard_auth_token'
const SHARE_TOKEN_PARAM = 'share_token'

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

function getShareTokenFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search)
  return params.get(SHARE_TOKEN_PARAM)
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
  if (!params) return url

  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(`${key}[]`, String(v)))
    } else {
      searchParams.append(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `${url}?${queryString}` : url
}

function timeoutPromise(ms: number, signal?: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new ApiError('请求超时，请稍后重试', 408))
    }, ms)

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeoutId)
      })
    }
  })
}

async function fetchWithRetry<T>(
  url: string,
  config: RequestConfig,
  retriesLeft: number,
): Promise<T> {
  const { params, timeout = DEFAULT_TIMEOUT, skipAuth, shareToken, retries, ...fetchConfig } = config

  const fullUrl = buildUrl(url, params)

  const headers = new Headers(fetchConfig.headers || {})
  if (!headers.has('Content-Type') && !(fetchConfig.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('Accept', 'application/json')

  if (!skipAuth) {
    const authToken = getAuthToken()
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`)
    }
  }

  if (shareToken) {
    headers.set('X-Share-Token', shareToken)
  } else {
    const urlShareToken = getShareTokenFromUrl()
    if (urlShareToken) {
      headers.set('X-Share-Token', urlShareToken)
    }
  }

  const controller = new AbortController()

  try {
    const response = await Promise.race([
      fetch(fullUrl, {
        ...fetchConfig,
        headers,
        signal: controller.signal,
        credentials: 'include',
      }),
      timeoutPromise(timeout, controller.signal),
    ])

    const isJson = response.headers.get('content-type')?.includes('application/json')
    if (!isJson) {
      if (response.ok) {
        return response.blob() as unknown as T
      }
      throw new ApiError(`请求失败: ${response.statusText}`, response.status)
    }

    const result: ApiResponse<T> = await response.json()

    if (result.code === 0 || result.code === 200) {
      return result.data
    }

    if (result.code === 401) {
      removeAuthToken()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      throw new ApiError('登录已过期，请重新登录', result.code, result.data, result.traceId)
    }

    if (result.code === 403) {
      throw new ApiError('无权限访问该资源', result.code, result.data, result.traceId)
    }

    throw new ApiError(result.message || '请求失败', result.code, result.data, result.traceId)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    if (retriesLeft > 0 && (!fetchConfig.method || fetchConfig.method.toUpperCase() === 'GET')) {
      console.warn(`请求失败，正在重试 (${MAX_RETRIES - retriesLeft + 1}/${MAX_RETRIES}):`, url)
      await new Promise((resolve) => setTimeout(resolve, 500 * (MAX_RETRIES - retriesLeft + 1)))
      return fetchWithRetry<T>(url, config, retriesLeft - 1)
    }

    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new ApiError('网络连接失败，请检查网络设置', 503)
    }

    if (error instanceof Error) {
      throw new ApiError(error.message || '未知错误', 500)
    }

    throw new ApiError('未知错误', 500)
  } finally {
    controller.abort()
  }
}

export async function request<T = unknown>(url: string, config: RequestConfig = {}): Promise<T> {
  const retries = config.retries ?? MAX_RETRIES
  return fetchWithRetry<T>(url, config, retries)
}

export function get<T = unknown>(url: string, config: Omit<RequestConfig, 'method'> = {}): Promise<T> {
  return request<T>(url, { ...config, method: 'GET' })
}

export function post<T = unknown>(
  url: string,
  data?: unknown,
  config: Omit<RequestConfig, 'method' | 'body'> = {},
): Promise<T> {
  const body = data instanceof FormData ? data : JSON.stringify(data)
  return request<T>(url, { ...config, method: 'POST', body })
}

export function put<T = unknown>(
  url: string,
  data?: unknown,
  config: Omit<RequestConfig, 'method' | 'body'> = {},
): Promise<T> {
  const body = data instanceof FormData ? data : JSON.stringify(data)
  return request<T>(url, { ...config, method: 'PUT', body })
}

export function del<T = unknown>(url: string, config: Omit<RequestConfig, 'method'> = {}): Promise<T> {
  return request<T>(url, { ...config, method: 'DELETE' })
}

export async function downloadFile(
  url: string,
  config: Omit<RequestConfig, 'method'> = {},
  fileName?: string,
): Promise<void> {
  const blob = await get<Blob>(url, { ...config, timeout: 60000 })

  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = fileName || `export_${Date.now()}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(downloadUrl)
}
