import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const analyticsAPI = {
  getTagTrend: (days = 30) =>
    api.get('/analytics/tag-trend', { params: { days } }).then(res => res.data),

  getProgressComposition: () =>
    api.get('/analytics/progress-composition').then(res => res.data),

  getGradeFeedback: (params = {}) =>
    api.get('/analytics/grade-feedback', { params }).then(res => res.data),

  getAnomalyAlerts: (params = {}) =>
    api.get('/analytics/anomaly-alerts', { params }).then(res => res.data),

  getChapterRank: (params = {}) =>
    api.get('/analytics/chapter-rank', { params }).then(res => res.data),

  getRefreshInfo: (dataSource = 'all') =>
    api.get('/meta/refresh-info', { params: { data_source: dataSource } }).then(res => res.data)
}

export const shareAPI = {
  createShare: (data) =>
    api.post('/share/create', data).then(res => res.data),

  getShareContent: (token) =>
    api.get(`/share/${token}`).then(res => res.data),

  getShareInfo: (token) =>
    api.get(`/share/${token}/info`).then(res => res.data)
}

export default api
