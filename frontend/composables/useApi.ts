import type {
  TransferRecord,
  TransferRecordCreate,
  TransferRecordUpdate,
  Quotation,
  QuotationCreate,
  FinanceDoc,
  VehicleProfile,
  ExceptionItem,
  AnalyticsOverview,
  PaginatedResponse,
} from '~/types'

export function useApi() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBase as string

  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = useCookie('token').value
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.detail || `API Error: ${res.status}`)
    }
    if (res.status === 204) return undefined as T
    return res.json()
  }

  return {
    get: <T>(path: string) => request<T>(path, { method: 'GET' }),

    post: <T>(path: string, body: unknown) =>
      request<T>(path, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    patch: <T>(path: string, body: unknown) =>
      request<T>(path, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

    upload: async <T>(path: string, formData: FormData) => {
      const token = useCookie('token').value
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const res = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers,
        body: formData,
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.detail || `Upload Error: ${res.status}`)
      }
      return res.json() as Promise<T>
    },

    getRecords: (params: Record<string, string | number> = {}) => {
      const qs = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ).toString()
      return request<PaginatedResponse<TransferRecord>>(`/transfer-records/?${qs}`)
    },

    getRecord: (id: string) => request<TransferRecord>(`/transfer-records/${id}/`),

    createRecord: (data: TransferRecordCreate) =>
      request<TransferRecord>('/transfer-records/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateRecord: (id: string, data: TransferRecordUpdate) =>
      request<TransferRecord>(`/transfer-records/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    submitForReview: (id: string) =>
      request<TransferRecord>(`/transfer-records/${id}/submit_review/`, { method: 'POST' }),

    approveReview: (id: string, note: string) =>
      request<TransferRecord>(`/transfer-records/${id}/approve_review/`, {
        method: 'POST',
        body: JSON.stringify({ review_note: note }),
      }),

    rejectReview: (id: string, note: string) =>
      request<TransferRecord>(`/transfer-records/${id}/reject_review/`, {
        method: 'POST',
        body: JSON.stringify({ review_note: note }),
      }),

    getQuotations: (recordId: string) =>
      request<Quotation[]>(`/transfer-records/${recordId}/quotations/`),

    addQuotation: (recordId: string, data: QuotationCreate) =>
      request<Quotation>(`/transfer-records/${recordId}/quotations/`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getFinanceDoc: (recordId: string) =>
      request<FinanceDoc>(`/transfer-records/${recordId}/finance/`),

    updateFinanceDoc: (recordId: string, data: Partial<FinanceDoc>) =>
      request<FinanceDoc>(`/transfer-records/${recordId}/finance/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    getVehicleProfile: (recordId: string) =>
      request<VehicleProfile>(`/transfer-records/${recordId}/vehicle/`),

    updateVehicleProfile: (recordId: string, data: Partial<VehicleProfile>) =>
      request<VehicleProfile>(`/transfer-records/${recordId}/vehicle/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    getExceptions: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString()
      return request<PaginatedResponse<ExceptionItem>>(`/exception-items/?${qs}`)
    },

    updateException: (id: string, data: Partial<ExceptionItem>) =>
      request<ExceptionItem>(`/exception-items/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    addExceptionNote: (id: string, content: string) =>
      request<ExceptionItem>(`/exception-items/${id}/add_note/`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),

    getAnalytics: () => request<AnalyticsOverview>('/analytics/overview/'),

    addReviewTag: (recordId: string, tagName: string) =>
      request<TransferRecord>(`/transfer-records/${recordId}/add_tag/`, {
        method: 'POST',
        body: JSON.stringify({ tag_name: tagName }),
      }),
  }
}
