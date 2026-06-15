import request from '@/utils/request'

export const getOverview = () => {
  return request.get('/dashboard/overview')
}

export const getTagDistribution = () => {
  return request.get('/dashboard/tag-distribution')
}

export const getProgressFunnel = () => {
  return request.get('/dashboard/progress-funnel')
}

export const getScoreRanking = (limit = 20) => {
  return request.get('/dashboard/score-ranking', { params: { limit } })
}

export const getBottomProgress = (limit = 20) => {
  return request.get('/dashboard/bottom-progress', { params: { limit } })
}

export const getExpiringStudents = (days = 30) => {
  return request.get('/dashboard/expiring-students', { params: { days } })
}

export const getAllConsultantStats = () => {
  return request.get('/dashboard/consultant-stats')
}

export const getConsultantStats = (consultantId) => {
  return request.get(`/dashboard/consultant/${consultantId}`)
}

export const refreshCache = () => {
  return request.post('/dashboard/cache/refresh')
}
