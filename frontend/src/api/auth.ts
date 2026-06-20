import request from '../utils/request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export const authApi = {
  login: (data: LoginParams) => {
    const formData = new FormData()
    formData.append('username', data.username)
    formData.append('password', data.password)
    return request.post<unknown, LoginResponse>('/auth/login', formData)
  },

  getMe: () => request.get('/auth/me'),
}
