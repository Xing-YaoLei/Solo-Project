import request from '../utils/request'

export const exportApi = {
  exportCheckinRecords: (scheduleId?: number) => {
    const params = scheduleId ? `?schedule_id=${scheduleId}` : ''
    window.open(`/api/export/checkin-records${params}`, '_blank')
  },

  exportSponsorList: (scheduleId?: number) => {
    const params = scheduleId ? `?schedule_id=${scheduleId}` : ''
    window.open(`/api/export/sponsor-list${params}`, '_blank')
  },

  exportPerformanceSummary: () => {
    window.open('/api/export/performance-summary', '_blank')
  },
}

export const dataApi = {
  refreshAll: () => request.post('/data/refresh/all'),
  refreshMiniapp: () => request.post('/data/refresh/miniapp-orders'),
  refreshMerchant: () => request.post('/data/refresh/merchant-transactions'),
  refreshCamera: () => request.post('/data/refresh/camera-statistics'),
}

export interface CreateShareParams {
  view_name: string
  filters?: Record<string, unknown>
  allowed_role: string
  expires_in_hours?: number
}

export interface CreateShareResponse {
  token: string
  view_name: string
  allowed_role: string
  expires_at: string
  share_url: string
}

export const shareApi = {
  createShare: (data: CreateShareParams) =>
    request.post<unknown, CreateShareResponse>('/share/create', data),

  revokeShare: (token: string) => request.post(`/share/revoke/${token}`),
}
