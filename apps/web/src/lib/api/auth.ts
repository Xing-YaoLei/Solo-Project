import apiClient from './axios';
import type {
  Notification,
  NotificationTemplate,
  NotificationType,
  User,
  PaginationParams,
  PaginatedResult,
} from './types';

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role?: string;
  department?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  user: User;
}

export interface NotificationsFilters {
  type?: NotificationType;
  isRead?: boolean;
  taskId?: string;
}

export interface MarkReadRequest {
  notificationIds?: string[];
  all?: boolean;
}

export interface SendTemplatedRequest {
  templateId: string;
  recipientIds: string[];
  variables?: Record<string, string>;
  taskId?: string;
  evidenceId?: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const { data: res } = await apiClient.post('/auth/login', data);
    return res;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const { data: res } = await apiClient.post('/auth/register', data);
    return res;
  },

  getProfile: async (): Promise<User> => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};
