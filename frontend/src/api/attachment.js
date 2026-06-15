import request from '@/utils/request'

export const attachmentApi = {
  upload(appointmentId, formData) {
    return request.post(`/appointments/${appointmentId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  download(id) {
    return request.get(`/attachments/${id}/download`, { responseType: 'blob' })
  },
  delete(id) {
    return request.delete(`/attachments/${id}`)
  },
  getByAppointment(appointmentId) {
    return request.get(`/appointments/${appointmentId}/attachments`)
  }
}
