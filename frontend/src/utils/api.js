import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const settlementApi = {
  getTrend: (params) => api.get('/settlement/trend', { params }),
  getOrders: (params) => api.get('/settlement/orders', { params }),
  getApprovalNodes: (settlementId) =>
    api.get('/settlement/approval-nodes', { params: { settlement_id: settlementId } }),
  getAmountChecks: (settlementId) =>
    api.get('/settlement/amount-checks', { params: { settlement_id: settlementId } }),
  getCaliberDiffs: (params) => api.get('/settlement/caliber-diffs', { params }),
  getDashboardSummary: () => api.get('/settlement/dashboard/summary'),
  getSettlementRules: () => api.get('/settlement/rules'),
  downloadData: (params) => api.get('/settlement/download', { params }),
}

export default api
