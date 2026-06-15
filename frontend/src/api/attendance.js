import request from '@/utils/request'

export const attendanceApi = {
  checkIn(id, data) {
    return request.post(`/appointments/${id}/check-in`, data)
  },
  batchCheckIn(data) {
    return request.post('/appointments/batch-check-in', data)
  },
  getRate(params) {
    return request.get('/attendance/rate', { params })
  }
}
