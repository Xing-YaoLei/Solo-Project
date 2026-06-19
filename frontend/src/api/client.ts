import type { ComplaintListItem, Complaint, VisitResult, Responsibility, Review, StatsByChannel, StatsByHandler, StatsByClosureDuration, StatsByReviewTag } from '@/types'

const API_BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) throw new Error(`API Error: ${res.status}`)
  return res.json()
}

export const api = {
  complaints: {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      return request<ComplaintListItem[]>(`/complaints${query}`)
    },
    get: (id: string) => request<Complaint>(`/complaints/${id}`),
    create: (data: Record<string, unknown>) => request<Complaint>('/complaints', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) => request<Complaint>(`/complaints/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) => request<Complaint>(`/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    addHandlingRecord: (id: string, data: Record<string, unknown>) => request<Record<string, unknown>>(`/complaints/${id}/handling-records`, { method: 'POST', body: JSON.stringify(data) }),
    addTag: (id: string, tag: string) => request<Record<string, unknown>>(`/complaints/${id}/tags`, { method: 'POST', body: JSON.stringify({ tag }) }),
    removeTag: (id: string, tagName: string) => request<void>(`/complaints/${id}/tags/${encodeURIComponent(tagName)}`, { method: 'DELETE' }),
  },
  visitResults: {
    create: (data: Record<string, unknown>) => request<VisitResult>('/visit-results', { method: 'POST', body: JSON.stringify(data) }),
    list: (complaintId: string) => request<VisitResult[]>(`/visit-results/${complaintId}`),
    update: (id: string, data: Record<string, unknown>) => request<VisitResult>(`/visit-results/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  responsibilities: {
    create: (data: Record<string, unknown>) => request<Responsibility>('/responsibilities', { method: 'POST', body: JSON.stringify(data) }),
    list: (complaintId: string) => request<Responsibility[]>(`/responsibilities/${complaintId}`),
    update: (id: string, data: Record<string, unknown>) => request<Responsibility>(`/responsibilities/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  reviews: {
    create: (data: Record<string, unknown>) => request<Review>('/reviews', { method: 'POST', body: JSON.stringify(data) }),
    list: (complaintId: string) => request<Review[]>(`/reviews/${complaintId}`),
    update: (id: string, data: Record<string, unknown>) => request<Review>(`/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  stats: {
    byChannel: () => request<StatsByChannel[]>('/stats/by-channel'),
    byHandler: () => request<StatsByHandler[]>('/stats/by-handler'),
    byClosureDuration: () => request<StatsByClosureDuration[]>('/stats/by-closure-duration'),
    byReviewTag: () => request<StatsByReviewTag[]>('/stats/by-review-tag'),
  },
}
