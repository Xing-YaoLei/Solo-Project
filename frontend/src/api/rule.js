import request from '@/utils/request'

export const getActiveRules = () => {
  return request.get('/reminder-rules/active')
}

export const getRecentChanges = (limit = 10) => {
  return request.get('/reminder-rules/recent-changes', { params: { limit } })
}

export const getRulesByType = (ruleType) => {
  return request.get(`/reminder-rules/type/${ruleType}`)
}

export const getRuleTypeStats = () => {
  return request.get('/reminder-rules/type-stats')
}

export const getRuleById = (id) => {
  return request.get(`/reminder-rules/${id}`)
}

export const createRule = (data, params) => {
  return request.post('/reminder-rules', data, { params })
}

export const updateRule = (id, data, params) => {
  return request.put(`/reminder-rules/${id}`, data, { params })
}

export const getVersionDistribution = () => {
  return request.get('/reminder-rules/version-distribution')
}
