import api from './client';
import type { Token, User, UserLogin } from '@/types';

export const login = async (data: UserLogin): Promise<Token> => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/users/me');
  return response.data;
};

export const getWorkers = async (): Promise<User[]> => {
  const response = await api.get('/users/workers');
  return response.data;
};
