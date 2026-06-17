import request, { setToken, removeToken } from '../utils/request';
import { LoginRequest, LoginResponse, User } from '../types';

export const authAPI = {
  login: (data: LoginRequest) =>
    request.post<unknown, LoginResponse>('/auth/login', data).then((res) => {
      const response = res as unknown as LoginResponse;
      if (response.token) {
        setToken(response.token);
      }
      return response;
    }),

  logout: () => {
    removeToken();
    return request.post<unknown, void>('/auth/logout');
  },

  getCurrentUser: () =>
    request.get<unknown, User>('/auth/me'),
};

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  return authAPI.login({ username, password });
};

export const logout = async (): Promise<void> => {
  try {
    await authAPI.logout();
  } finally {
    removeToken();
  }
};

export const getCurrentUser = async (): Promise<User> => {
  return authAPI.getCurrentUser();
};
