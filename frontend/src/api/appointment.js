import request from '@/utils/request'

export const appointmentApi = {
  search(params) {
    return request.get('/appointments', { params })
  },
  getById(id) {
    return request.get(`/appointments/${id}`)
  },
  create(data) {
    return request.post('/appointments', data)
  },
  update(id, data) {
    return request.put(`/appointments/${id}`, data)
  },
  delete(id) {
    return request.delete(`/appointments/${id}`)
  },
  reschedule(id, data) {
    return request.post(`/appointments/${id}/reschedule`, data)
  },
  batchStatus(data) {
    return request.put('/appointments/batch-status', data)
  },
  getConflicts(params) {
    return request.get('/appointments/conflicts', { params })
  },
  getChangeLog(id) {
    return request.get(`/appointments/${id}/change-log`)
  },
  getAllChangeLogs(params) {
    return request.get('/appointments/change-logs', { params })
  },
  batchConfirm(ids) {
    return request.put('/appointments/batch-confirm', { ids })
  },
  batchCancel(ids) {
    return request.put('/appointments/batch-cancel', { ids })
  }
}
