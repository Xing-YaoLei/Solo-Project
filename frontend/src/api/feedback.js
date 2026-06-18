import request from './request'

export function getFeedback(id) {
  return request.get(`/api/feedbacks/${id}`)
}

export function createFeedback(data) {
  return request.post('/api/feedbacks', data)
}

export function updateFeedback(data) {
  return request.put('/api/feedbacks', data)
}

export function getFeedbackChangeLogs(feedbackId) {
  return request.get(`/api/feedbacks/${feedbackId}/change-logs`)
}
