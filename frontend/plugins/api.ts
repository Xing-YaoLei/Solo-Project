import { defineNuxtPlugin, navigateTo, useRuntimeConfig } from '#imports'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  params?: Record<string, any>
  isFormData?: boolean
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private buildUrl(url: string, params?: Record<string, any>) {
    let full = url.startsWith('http') ? url : `${this.baseURL}${url}`
    if (params) {
      const usp = new URLSearchParams()
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          usp.append(k, String(v))
        }
      })
      const query = usp.toString()
      if (query) full += (full.includes('?') ? '&' : '?') + query
    }
    return full
  }

  private getAuthHeader(): Record<string, string> {
    const token = typeof localStorage !== 'undefined'
      ? localStorage.getItem('cardealer_token')
      : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async request<T = any>(url: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', headers = {}, body, params, isFormData } = options
    const fullUrl = this.buildUrl(url, params)
    const finalHeaders: Record<string, string> = {
      ...this.getAuthHeader(),
      ...headers,
    }
    if (!isFormData && body && !(body instanceof FormData)) {
      finalHeaders['Content-Type'] = 'application/json'
    }

    const init: RequestInit = {
      method,
      headers: finalHeaders,
    }
    if (body) {
      init.body = body instanceof FormData || isFormData
        ? body as FormData
        : JSON.stringify(body)
    }

    try {
      const resp = await fetch(fullUrl, init)
      if (resp.status === 401) {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('cardealer_token')
          localStorage.removeItem('cardealer_user')
        }
        if (typeof navigateTo !== 'undefined') {
          await navigateTo('/login')
        }
        throw new Error('登录已过期，请重新登录')
      }
      const text = await resp.text()
      let data: any = text
      try { data = JSON.parse(text) } catch { /* keep text */ }
      if (!resp.ok) {
        const msg = data?.detail || data?.message || `请求失败 (${resp.status})`
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
      }
      return data as T
    } catch (e: any) {
      if (e.message && typeof e.message === 'string') {
        throw e
      }
      throw new Error('网络错误，请检查连接')
    }
  }

  get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(url, { method: 'GET', params })
  }

  post<T = any>(url: string, body?: any, options?: ApiOptions): Promise<T> {
    return this.request<T>(url, { method: 'POST', body, ...options })
  }

  put<T = any>(url: string, body?: any): Promise<T> {
    return this.request<T>(url, { method: 'PUT', body })
  }

  patch<T = any>(url: string, body?: any): Promise<T> {
    return this.request<T>(url, { method: 'PATCH', body })
  }

  delete<T = any>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' })
  }

  upload<T = any>(url: string, formData: FormData): Promise<T> {
    return this.request<T>(url, { method: 'POST', body: formData, isFormData: true })
  }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const api = new ApiClient(config.public.apiBase as string)
  return {
    provide: {
      api,
    },
  }
})
