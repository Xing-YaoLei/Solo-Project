import apiClient from './axios';
import type {
  User,
  UserRole,
  PaginationParams,
  PaginatedResult,
} from './types';

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  department?: string;
  position?: string;
  phone?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  role?: UserRole;
  department?: string;
  position?: string;
  phone?: string;
  isActive?: boolean;
  password?: string;
}

export interface UserFilters {
  role?: UserRole;
  department?: string;
  isActive?: boolean;
}

export const usersApi = {
  getUsers: async (
    params: PaginationParams & UserFilters = {},
  ): Promise<PaginatedResult<User>> => {
    const { data } = await apiClient.get('/users', { params });
    return data;
  },

  getUser: async (id: string): Promise<User> => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data;
  },

  createUser: async (data: CreateUserRequest): Promise<User> => {
    const res = await apiClient.post('/users', data);
    return res.data;
  },

  updateUser: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const res = await apiClient.patch(`/users/${id}`, data);
    return res.data;
  },

  deleteUser: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/users/${id}`);
    return data;
  },

  getUsersByRole: async (role: UserRole): Promise<User[]> => {
    const { data } = await apiClient.get('/users', {
      params: { role, page: 1, pageSize: 100 },
    });
    return data.items || [];
  },
};
