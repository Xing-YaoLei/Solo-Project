import { api } from './http'
import type {
  Attachment,
  ApprovalNode,
  ExceptionHistory,
  ExceptionRecord,
  InvoiceItem,
  PaginatedResponse,
  Payment,
  Quote,
  QuoteDetail,
  TokenResponse,
  User,
} from '../types'

export interface LoginParams {
  username: string
  password: string
}

export interface QuoteCreateParams {
  title: string
  client_name: string
  client_contact?: string
  client_phone?: string
  case_description?: string
  case_type?: string
  total_amount?: number
  discounted_amount?: number
  currency?: string
  priority?: string
  assigned_to?: string
  expected_payment_date?: string
  payment_deadline?: string
  remarks?: string
  invoice_items?: Array<{
    item_name: string
    fee_type: string
    description?: string
    quantity: number
    unit_price: number
    discount_rate: number
    amount: number
    actual_amount: number
  }>
}

export const authApi = {
  login: (params: LoginParams) => api.post<TokenResponse>('/auth/login', params),
  getMe: () => api.get<User>('/auth/me'),
  changePassword: (data: { old_password: string; new_password: string }) =>
    api.put('/auth/me/password', data),
  listUsers: (params?: {
    page?: number
    page_size?: number
    role?: string
    keyword?: string
  }) => api.get<PaginatedResponse<User>>('/auth/users', { params }),
  createUser: (data: Record<string, unknown>) => api.post<User>('/auth/users', data),
  updateUser: (id: string, data: Record<string, unknown>) => api.put<User>(`/auth/users/${id}`, data),
}

export const quotesApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Quote>>('/quotes', { params }),
  create: (data: QuoteCreateParams) => api.post<QuoteDetail>('/quotes', data),
  get: (id: string) => api.get<QuoteDetail>(`/quotes/${id}`),
  update: (id: string, data: Record<string, unknown>) =>
    api.put<QuoteDetail>(`/quotes/${id}`, data),
  updateStatus: (id: string, data: { status: string; comment?: string }) =>
    api.patch<QuoteDetail>(`/quotes/${id}/status`, data),
  batchUpdateStatus: (data: { quote_ids: string[]; status: string; comment?: string }) =>
    api.post('/quotes/batch/status', data),
  delete: (id: string) => api.delete(`/quotes/${id}`),
}

export const invoicesApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<InvoiceItem>>('/invoices', { params }),
  create: (quoteId: string, data: Record<string, unknown>) =>
    api.post<InvoiceItem>('/invoices', data, { params: { quote_id: quoteId } }),
  batchCreate: (quoteId: string, items: Array<Record<string, unknown>>) =>
    api.post('/invoices/batch', items, { params: { quote_id: quoteId } }),
  update: (id: string, data: Record<string, unknown>) =>
    api.put<InvoiceItem>(`/invoices/${id}`, data),
  delete: (id: string) => api.delete(`/invoices/${id}`),
  batchDelete: (ids: string[]) => api.post('/invoices/batch/delete', ids),
}

export const approvalsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<ApprovalNode>>('/approvals', { params }),
  createFlow: (data: { quote_id: string; nodes: Array<Record<string, unknown>> }) =>
    api.post('/approvals/flow', data),
  action: (id: string, data: { status: string; comment?: string }) =>
    api.post<ApprovalNode>(`/approvals/${id}/action`, data),
  batchAction: (data: { node_ids: string[]; status: string; comment?: string }) =>
    api.post('/approvals/batch/action', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put<ApprovalNode>(`/approvals/${id}`, data),
  delete: (id: string) => api.delete(`/approvals/${id}`),
}

export const paymentsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Payment>>('/payments', { params }),
  create: (data: Record<string, unknown>) => api.post<Payment>('/payments', data),
  get: (id: string) => api.get<Payment>(`/payments/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put<Payment>(`/payments/${id}`, data),
  confirm: (id: string, data?: { comment?: string }) =>
    api.post<Payment>(`/payments/${id}/confirm`, data || {}),
  delete: (id: string) => api.delete(`/payments/${id}`),
}

export const exceptionsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<ExceptionRecord>>('/exceptions', { params }),
  create: (data: Record<string, unknown>) => api.post<ExceptionRecord>('/exceptions', data),
  get: (id: string) => api.get<ExceptionRecord>(`/exceptions/${id}`),
  update: (id: string, data: Record<string, unknown>) =>
    api.put<ExceptionRecord>(`/exceptions/${id}`, data),
  updateStatus: (id: string, data: { status: string; comment: string; source_record?: string }) =>
    api.post<ExceptionRecord>(`/exceptions/${id}/status`, data),
  getHistory: (id: string) => api.get<ExceptionHistory[]>(`/exceptions/${id}/history`),
  delete: (id: string) => api.delete(`/exceptions/${id}`),
}

export const attachmentsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Attachment>>('/attachments', { params }),
  upload: (formData: FormData) => api.upload<Attachment>('/attachments/upload', formData),
  batchUpload: (formData: FormData) => api.upload<Attachment[]>('/attachments/batch-upload', formData),
  update: (id: string, data: Record<string, unknown>) =>
    api.put<Attachment>(`/attachments/${id}`, data),
  delete: (id: string) => api.delete(`/attachments/${id}`),
}

export const statisticsApi = {
  getOverview: (params?: Record<string, unknown>) =>
    api.get('/statistics/overview', { params }),
  getStatusDistribution: (params?: Record<string, unknown>) =>
    api.get('/statistics/quote-status-distribution', { params }),
  getCollectionCycle: (params?: Record<string, unknown>) =>
    api.get('/statistics/payment-collection-cycle', { params }),
  getMonthlyRevenue: (params?: { months?: number }) =>
    api.get('/statistics/monthly-revenue', { params }),
  getExceptionTypes: () => api.get('/statistics/exception-types'),
  getQuotesByCycle: (params?: { min_days?: number; max_days?: number }) =>
    api.get<Quote[]>('/statistics/quotes-by-cycle', { params }),
}
