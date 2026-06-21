import api from './api';
import type { LoginRequest, LoginResponse, User } from '../types';

export const authService = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data).then(r => r.data),
  getMe: () => api.get<User>('/auth/me').then(r => r.data),
};
