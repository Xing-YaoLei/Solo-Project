import request, { setToken, removeToken } from '../utils/request';
import { LoginRequest, LoginResponse, User } from '../types';

export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', data.username);
    formData.append('password', data.password);

    const response = await request.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const token = (response as unknown as { access_token: string }).access_token;

    if (token) {
      setToken(token);
    }

    const user = await authAPI.getCurrentUser();

    return {
      token,
      user,
    };
  },

  logout: () => {
    removeToken();
    return Promise.resolve();
  },

  getCurrentUser: (): Promise<User> =>
    request.get('/auth/me') as Promise<User>,
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
