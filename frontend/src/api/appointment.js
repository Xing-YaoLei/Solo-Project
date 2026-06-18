import request from './request'

export function getDispatchBoard(date) {
  return request.get('/api/appointments/dispatch', { params: { date } })
}

export function createAppointment(data) {
  return request.post('/api/appointments', data)
}

export function updateAppointmentStatus(id, status, operator) {
  return request.put(`/api/appointments/${id}/status`, null, { params: { status, operator } })
}

export function getSalesFollowUps(appointmentId) {
  return request.get('/api/sales-follow-ups', { params: { appointmentId } })
}

export function createSalesFollowUp(data) {
  return request.post('/api/sales-follow-ups', data)
}
