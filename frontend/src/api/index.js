import axios from 'axios'

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
})

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  },
)

export const api = {
  refresh: (triggeredBy = 'frontend_user') =>
    request.post('/refresh', null, { params: { triggered_by: triggeredBy } }),

  getFunnel: (params) => request.get('/funnel/', { params }),
  getSalesTrend: (promotionId, params) =>
    request.get('/funnel/sales-trend', { params: { promotion_id: promotionId, ...params } }),
  getDisplayImpactRanges: (promotionId) =>
    request.get('/funnel/display-impact-ranges', { params: { promotion_id: promotionId } }),
  scanExceptions: (promotionId) =>
    request.get('/funnel/exceptions/scan', { params: { promotion_id: promotionId } }),

  getStores: (params) => request.get('/stores', { params }),
  getPromotions: (params) => request.get('/promotions', { params }),

  getRectifications: (params) => request.get('/rectifications', { params }),
  createRectification: (data) => request.post('/rectifications', data),
  updateRectification: (id, data) => request.put(`/rectifications/${id}`, data),

  getInspections: (params) => request.get('/inspections', { params }),
  createInspection: (data) => request.post('/inspections', data),
  uploadInspectionPhoto: (inspectionId, formData) =>
    request.post(`/inspections/${inspectionId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getAnnotations: (params) => request.get('/annotations', { params }),
  createAnnotation: (data) => request.post('/annotations', data),
  updateAnnotation: (id, data) => request.put(`/annotations/${id}`, data),

  getThresholds: () => request.get('/thresholds/'),
  createThreshold: (data) => request.post('/thresholds/', data),
  updateThreshold: (id, data) => request.put(`/thresholds/${id}`, data),
  deleteThreshold: (id) => request.delete(`/thresholds/${id}`),

  getRefreshLogs: (limit = 20) => request.get('/refresh-logs', { params: { limit } }),

  downloadFunnelReport: (params) => {
    const query = new URLSearchParams(params).toString()
    window.open(`/api/v1/download/funnel-report?${query}`, '_blank')
  },
  downloadSalesTrendReport: (promotionId) => {
    window.open(
      `/api/v1/download/sales-trend-report?promotion_id=${promotionId}`,
      '_blank',
    )
  },
}

export const EXCEPTION_LABELS = {
  cashier_delay: { label: '收银系统延迟', color: '#d46b08', tagClass: 'tag-cashier', icon: '⏱️' },
  member_missing: { label: '会员记录缺失', color: '#531dab', tagClass: 'tag-member', icon: '👥' },
  mi_caliber_change: { label: '医保接口口径变化', color: '#08979c', tagClass: 'tag-mi', icon: '🏥' },
}
