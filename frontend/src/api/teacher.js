import request from '@/utils/request'

export const teacherApi = {
  getList() {
    return request.get('/teachers')
  }
}
