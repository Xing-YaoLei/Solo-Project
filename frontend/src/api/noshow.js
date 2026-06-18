import request from './request'

export function getNoShowAlerts(responsiblePerson) {
  return request.get('/api/no-shows/alerts', { params: { responsiblePerson } })
}

export function getNoShowLogsByAppointment(appointmentId) {
  return request.get(`/api/no-shows/appointment/${appointmentId}`)
}

export function handleNoShow(logId, reason, handleAction, closedBy) {
  return request.put(`/api/no-shows/${logId}/handle`, null, { params: { reason, handleAction, closedBy } })
}

export function hasNoShowAlert(responsiblePerson) {
  return request.get('/api/no-shows/has-alert', { params: { responsiblePerson } })
}
