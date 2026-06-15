import request from '@/utils/request'

export const importEnrollment = (data, params = {}) => {
  return request.post('/import/enrollment', data, { params })
}

export const importAcademic = (data, params = {}) => {
  return request.post('/import/academic', data, { params })
}

export const importFeedback = (data, params = {}) => {
  return request.post('/import/feedback', data, { params })
}

export const mergeStudentData = (studentNos) => {
  return request.post('/import/merge', studentNos)
}
