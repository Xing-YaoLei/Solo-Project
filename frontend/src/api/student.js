import request from '@/utils/request'

export const getStudent = (studentNo) => {
  return request.get(`/students/${studentNo}`)
}

export const getStudents = (params) => {
  return request.get('/students', { params })
}

export const getStudentsByConsultant = (consultantId) => {
  return request.get(`/students/consultant/${consultantId}`)
}

export const updateStudent = (studentNo, data) => {
  return request.put(`/students/${studentNo}`, data)
}

export const getLowProgressStudents = (limit = 20) => {
  return request.get('/students/low-progress', { params: { limit } })
}
