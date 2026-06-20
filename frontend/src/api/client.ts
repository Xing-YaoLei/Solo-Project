import type { ApiResponse } from '@/types';

const BASE_URL = '/api';
const DEFAULT_TIMEOUT = 30000;

interface RequestOptions extends RequestInit {
  timeout?: number;
  params?: object;
}

class ApiError extends Error {
  code: number;
  data?: unknown;

  constructor(message: string, code: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.data = data;
  }
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function convertKeysToCamelCase<T = unknown>(obj: unknown): T {
  if (obj === null || obj === undefined) {
    return obj as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => convertKeysToCamelCase(item)) as T;
  }
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const camelKey = toCamelCase(key);
        const value = (obj as Record<string, unknown>)[key];
        result[camelKey] = convertKeysToCamelCase(value);
      }
    }
    return result as T;
  }
  return obj as T;
}

function buildQueryString(params: object): string {
  const searchParams = new URLSearchParams();
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT, params, headers, body, method = 'GET', ...rest } = options;

  const url = `${BASE_URL}${endpoint}${params ? buildQueryString(params) : ''}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const finalHeaders = { ...defaultHeaders, ...headers };

  const requestBody: BodyInit | undefined =
    body instanceof FormData
      ? body
      : body !== undefined && body !== null
        ? JSON.stringify(body)
        : undefined;

  try {
    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: requestBody,
      signal: controller.signal,
      ...rest,
    });

    clearTimeout(timeoutId);

    let data: ApiResponse<T>;
    try {
      const rawData = await response.json();
      data = convertKeysToCamelCase<ApiResponse<T>>(rawData);
    } catch {
      throw new ApiError('响应解析失败', -1);
    }

    if (!response.ok || !data.success) {
      throw new ApiError(
        data.message || `请求失败 (${response.status})`,
        data.code || response.status,
        data.data
      );
    }

    return data.data as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('请求超时，请稍后重试', -2);
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('网络连接失败，请检查网络', -3);
    }

    throw new ApiError(
      error instanceof Error ? error.message : '未知错误',
      -99
    );
  }
}

export const client = {
  get<T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(endpoint, { ...options, method: 'POST', body: body as BodyInit | undefined });
  },

  put<T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(endpoint, { ...options, method: 'PUT', body: body as BodyInit | undefined });
  },

  delete<T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },

  patch<T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return request<T>(endpoint, { ...options, method: 'PATCH', body: body as BodyInit | undefined });
  },
};

export default client;
export { ApiError };
export type { RequestOptions };
