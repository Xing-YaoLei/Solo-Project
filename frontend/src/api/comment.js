import request from '@/utils/request'

export const getCommentsByStudent = (studentNo) => {
  return request.get(`/comments/student/${studentNo}`)
}

export const getCommentsByConsultant = (consultantId) => {
  return request.get(`/comments/consultant/${consultantId}`)
}

export const getRiskLevelDistribution = () => {
  return request.get('/comments/risk-distribution')
}

export const getPendingFollowUps = () => {
  return request.get('/comments/pending-followups')
}

export const getCommentStatsByConsultant = () => {
  return request.get('/comments/consultant-stats')
}

export const createComment = (data) => {
  return request.post('/comments', data)
}

export const updateComment = (id, data) => {
  return request.put(`/comments/${id}`, data)
}
