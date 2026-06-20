import request from '../utils/request'

export const addressDictAPI = {
  list: (params) => request.get('/address-dict', { params }),
  get: (id) => request.get(`/address-dict/${id}`),
  create: (data) => request.post('/address-dict', data),
  update: (id, data) => request.put(`/address-dict/${id}`, data),
  delete: (id) => request.delete(`/address-dict/${id}`),
  getOptions: (params) => request.get('/address-dict/options/list', { params }),
  getAreas: () => request.get('/address-dict/areas/list'),
}

export const trackRulesAPI = {
  list: (params) => request.get('/track-rules', { params }),
  get: (id) => request.get(`/track-rules/${id}`),
  create: (data) => request.post('/track-rules', data),
  update: (id, data) => request.put(`/track-rules/${id}`, data),
  delete: (id) => request.delete(`/track-rules/${id}`),
}

export const subsidyRulesAPI = {
  list: (params) => request.get('/subsidy-rules', { params }),
  get: (id) => request.get(`/subsidy-rules/${id}`),
  create: (data) => request.post('/subsidy-rules', data),
  update: (id, data) => request.put(`/subsidy-rules/${id}`, data),
  delete: (id) => request.delete(`/subsidy-rules/${id}`),
  getTypes: () => request.get('/subsidy-rules/types/list'),
}

export const ordersAPI = {
  list: (params) => request.get('/orders', { params }),
  get: (id) => request.get(`/orders/${id}`),
  create: (data) => request.post('/orders', data),
  update: (id, data) => request.put(`/orders/${id}`, data),
  assign: (orderId, riderId) => request.post(`/orders/${orderId}/assign`, null, { params: { rider_id: riderId } }),
  reject: (data) => request.post('/orders/reject', data),
  supplement: (data) => request.post('/orders/supplement', data),
  close: (orderId, reason, operatorName) => request.post(`/orders/${orderId}/close`, null, { 
    params: { reason, operator_name: operatorName } 
  }),
  getStatusCount: () => request.get('/orders/status/count'),
}

export const appealsAPI = {
  list: (params) => request.get('/appeals', { params }),
  get: (id) => request.get(`/appeals/${id}`),
  create: (data) => request.post('/appeals', data),
  update: (id, data) => request.put(`/appeals/${id}`, data),
  addEvidence: (data) => request.post('/appeals/evidence', data),
  removeEvidence: (appealId, index) => request.delete(`/appeals/${appealId}/evidence/${index}`),
}

export const settlementsAPI = {
  list: (params) => request.get('/settlements', { params }),
  get: (id) => request.get(`/settlements/${id}`),
  create: (data) => request.post('/settlements', data),
  update: (id, data) => request.put(`/settlements/${id}`, data),
  confirm: (id, confirmedBy) => request.post(`/settlements/${id}/confirm`, null, { 
    params: { confirmed_by: confirmedBy } 
  }),
  getSummary: (params) => request.get('/settlements/summary/total', { params }),
}

export const statsAPI = {
  getCompensateOverview: (params) => request.get('/stats/compensate/overview', { params }),
  getCompensateByArea: (params) => request.get('/stats/compensate/by-area', { params }),
  getCompensateByHandler: (params) => request.get('/stats/compensate/by-handler', { params }),
  getCompensateTrend: (params) => request.get('/stats/compensate/trend', { params }),
  getOrderStatusSummary: () => request.get('/stats/order/status-summary'),
}

export const ridersAPI = {
  list: (params) => request.get('/riders', { params }),
  get: (id) => request.get(`/riders/${id}`),
  create: (data) => request.post('/riders', data),
  update: (id, data) => request.put(`/riders/${id}`, data),
  getOptions: (params) => request.get('/riders/options/list', { params }),
}
