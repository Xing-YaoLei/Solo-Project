import apiClient from './client'
import type { User, Store, Product, ReplenishmentOrder, ReplenishmentOrderListItem, PaginatedResponse, TemperatureAlert, AlertHistory, StatsTemperatureRate, StatsTemperatureDrillDown, BatchCode, QCRecord, Discrepancy, TemperatureRecord, Attachment, ActionLog, ReplenishmentStatus, DiscrepancyType, RoleEnum, TemperatureAlertStatus } from '@/types'

export interface LoginResponse {
  access_token: string
  token_type: string
}

export const authApi = {
  login: (username: string, password: string) => {
    const form = new FormData()
    form.append('username', username)
    form.append('password', password)
    return apiClient.post<LoginResponse>('/auth/login', form).then((r) => r.data)
  },
  me: () => apiClient.get<User>('/auth/me').then((r) => r.data),
  createUser: (data: { username: string; full_name: string; password: string; role: RoleEnum; phone?: string }) =>
    apiClient.post<User>('/auth/users', data).then((r) => r.data),
  listUsers: () => apiClient.get<User[]>('/auth/users').then((r) => r.data),
  updateUser: (id: number, data: Partial<{ full_name: string; role: RoleEnum; phone: string; is_active: boolean; password: string }>) =>
    apiClient.patch<User>(`/auth/users/${id}`, data).then((r) => r.data),
}

export const basicApi = {
  listStores: (activeOnly = true) =>
    apiClient.get<Store[]>('/stores', { params: { active_only: activeOnly } }).then((r) => r.data),
  createStore: (data: { code: string; name: string; address?: string; phone?: string }) =>
    apiClient.post<Store>('/stores', data).then((r) => r.data),
  listProducts: (activeOnly = true, keyword?: string) =>
    apiClient.get<Product[]>('/products', { params: { active_only: activeOnly, keyword } }).then((r) => r.data),
  createProduct: (data: { sku: string; name: string; category?: string; unit: string; min_temp: number; max_temp: number }) =>
    apiClient.post<Product>('/products', data).then((r) => r.data),
}

export interface OrderListParams {
  status?: ReplenishmentStatus
  store_id?: number
  date_from?: string
  date_to?: string
  keyword?: string
  page?: number
  page_size?: number
}

export interface OrderCreatePayload {
  store_id: number
  planned_date: string
  truck_no?: string
  driver_name?: string
  driver_phone?: string
  loading_list_no?: string
  remark?: string
  items: { product_id: number; planned_qty: number }[]
}

export interface OrderUpdatePayload {
  store_id?: number
  planned_date?: string
  truck_no?: string
  driver_name?: string
  driver_phone?: string
  loading_list_no?: string
  remark?: string
}

export const ordersApi = {
  list: (params: OrderListParams = {}) =>
    apiClient.get<PaginatedResponse<ReplenishmentOrderListItem>>('/orders', { params }).then((r) => r.data),
  get: (id: number) => apiClient.get<ReplenishmentOrder>(`/orders/${id}`).then((r) => r.data),
  create: (data: OrderCreatePayload) => apiClient.post<ReplenishmentOrder>('/orders', data).then((r) => r.data),
  update: (id: number, data: OrderUpdatePayload) =>
    apiClient.patch<ReplenishmentOrder>(`/orders/${id}`, data).then((r) => r.data),
  transition: (id: number, target_status: ReplenishmentStatus, remark?: string) =>
    apiClient.post<ReplenishmentOrder>(`/orders/${id}/transition`, { target_status, remark }).then((r) => r.data),
  batchOperation: (order_ids: number[], target_status?: ReplenishmentStatus, remark?: string) =>
    apiClient.post('/orders/batch-operation', { order_ids, target_status, remark }).then((r) => r.data),

  listBatches: (orderId: number) => apiClient.get<BatchCode[]>(`/orders/${orderId}/batches`).then((r) => r.data),
  addBatch: (orderId: number, data: { product_id: number; batch_no: string; qty: number; production_date?: string; expiry_date?: string }) =>
    apiClient.post<BatchCode>(`/orders/${orderId}/batches`, data).then((r) => r.data),
  verifyBatch: (orderId: number, batchId: number, data: { verified: boolean }) =>
    apiClient.patch<BatchCode>(`/orders/${orderId}/batches/${batchId}`, data).then((r) => r.data),

  listQC: (orderId: number) => apiClient.get<QCRecord[]>(`/orders/${orderId}/qc`).then((r) => r.data),
  createQC: (orderId: number, data: {
    product_id: number; batch_code_id?: number; temperature?: number;
    appearance_ok: boolean; packaging_ok: boolean; temperature_ok: boolean;
    passed: boolean; remark?: string; images: { file_path: string; file_name?: string }[]
  }) => apiClient.post<QCRecord>(`/orders/${orderId}/qc`, data).then((r) => r.data),

  listDiscrepancies: (orderId: number) => apiClient.get<Discrepancy[]>(`/orders/${orderId}/discrepancies`).then((r) => r.data),
  createDiscrepancy: (orderId: number, data: {
    product_id: number; type: DiscrepancyType; expected_qty?: number; actual_qty?: number; diff_qty?: number; description?: string
  }) => apiClient.post<Discrepancy>(`/orders/${orderId}/discrepancies`, data).then((r) => r.data),
  resolveDiscrepancy: (orderId: number, discId: number, resolution_note: string) =>
    apiClient.post<Discrepancy>(`/orders/${orderId}/discrepancies/${discId}/resolve`, { resolution_note }).then((r) => r.data),

  listTemperature: (orderId: number) => apiClient.get<TemperatureRecord[]>(`/orders/${orderId}/temperature`).then((r) => r.data),
  addTemperature: (orderId: number, data: { temperature: number; min_temp?: number; max_temp?: number; location?: string; device_id?: string; recorded_at?: string }) =>
    apiClient.post<TemperatureRecord>(`/orders/${orderId}/temperature`, data).then((r) => r.data),

  listAttachments: (orderId: number) => apiClient.get<Attachment[]>(`/orders/${orderId}/attachments`).then((r) => r.data),
  uploadAttachment: (orderId: number, file: File, category?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (category) form.append('category', category)
    return apiClient.post<Attachment>(`/orders/${orderId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },

  listLogs: (orderId: number) => apiClient.get<ActionLog[]>(`/orders/${orderId}/logs`).then((r) => r.data),
}

export interface AlertListParams {
  status?: TemperatureAlertStatus
  severity?: string
  order_id?: number
  page?: number
  page_size?: number
}

export const alertsApi = {
  list: (params: AlertListParams = {}) =>
    apiClient.get<PaginatedResponse<TemperatureAlert>>('/alerts', { params }).then((r) => r.data),
  get: (id: number) => apiClient.get<TemperatureAlert>(`/alerts/${id}`).then((r) => r.data),
  acknowledge: (id: number, note?: string) =>
    apiClient.post<TemperatureAlert>(`/alerts/${id}/acknowledge`, { note }).then((r) => r.data),
  startProcessing: (id: number, note?: string) =>
    apiClient.post<TemperatureAlert>(`/alerts/${id}/start-processing`, { note }).then((r) => r.data),
  resolve: (id: number, resolution?: string) =>
    apiClient.post<TemperatureAlert>(`/alerts/${id}/resolve`, { resolution }).then((r) => r.data),
  close: (id: number, resolution?: string) =>
    apiClient.post<TemperatureAlert>(`/alerts/${id}/close`, { resolution }).then((r) => r.data),
  history: (id: number) => apiClient.get<AlertHistory[]>(`/alerts/${id}/history`).then((r) => r.data),
}

export interface StatsParams {
  date_from?: string
  date_to?: string
  store_id?: number
}

export const statsApi = {
  temperatureRate: (params: StatsParams = {}) =>
    apiClient.get<StatsTemperatureRate[]>('/stats/temperature-rate', { params }).then((r) => r.data),
  temperatureDrilldown: (target_date?: string, store_id?: number) =>
    apiClient.get<StatsTemperatureDrillDown[]>('/stats/temperature-drilldown', { params: { target_date, store_id } }).then((r) => r.data),
  overview: () => apiClient.get<any>('/stats/overview').then((r) => r.data),
  byStore: (params: StatsParams = {}) =>
    apiClient.get<any[]>('/stats/by-store', { params }).then((r) => r.data),
}
