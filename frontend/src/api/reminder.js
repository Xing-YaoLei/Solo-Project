import request from '@/utils/request'

export const reminderApi = {
  getList(params) {
    return request.get('/reminders', { params })
  },
  create(data) {
    return request.post('/reminders', data)
  },
  update(id, data) {
    return request.put(`/reminders/${id}`, data)
  },
  delete(id) {
    return request.delete(`/reminders/${id}`)
  },
  send(id) {
    return request.post(`/reminders/${id}/send`)
  },
  batchSend(ids) {
    return request.post('/reminders/batch-send', { ids })
  }
}
