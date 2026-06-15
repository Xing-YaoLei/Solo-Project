import request from '@/utils/request'

export const authApi = {
  login(data) {
    return request.post('/auth/login', data)
  },
  register(data) {
    return request.post('/auth/register', data)
  },
  getUserInfo() {
    return request.get('/auth/user-info')
  }
}
