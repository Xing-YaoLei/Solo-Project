export function useApi() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const baseURL = config.public.apiBase as string

  function getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`
    }
    return headers
  }

  async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    return await $fetch<T>(url, {
      baseURL,
      method: 'GET',
      headers: getHeaders(),
      params,
    })
  }

  async function post<T>(url: string, body?: unknown): Promise<T> {
    return await $fetch<T>(url, {
      baseURL,
      method: 'POST',
      headers: getHeaders(),
      body,
    })
  }

  async function put<T>(url: string, body?: unknown): Promise<T> {
    return await $fetch<T>(url, {
      baseURL,
      method: 'PUT',
      headers: getHeaders(),
      body,
    })
  }

  async function patch<T>(url: string, body?: unknown): Promise<T> {
    return await $fetch<T>(url, {
      baseURL,
      method: 'PATCH',
      headers: getHeaders(),
      body,
    })
  }

  async function del<T>(url: string): Promise<T> {
    return await $fetch<T>(url, {
      baseURL,
      method: 'DELETE',
      headers: getHeaders(),
    })
  }

  return { get, post, put, patch, del }
}
