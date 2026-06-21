import { apiGet, apiPost } from '@/api/client';
import type {
  LoginRequest,
  TokenResponse,
  CurrentUser,
  ChangePasswordRequest,
  RefreshTokenRequest,
} from '@/types';

export const authApi = {
  login: async (data: LoginRequest): Promise<{ tokens: TokenResponse; user: CurrentUser }> => {
    return apiPost<{ tokens: TokenResponse; user: CurrentUser }>('/auth/login', data);
  },

  logout: async (): Promise<void> => {
    return apiPost<void>('/auth/logout');
  },

  refreshToken: async (data: RefreshTokenRequest): Promise<TokenResponse> => {
    return apiPost<TokenResponse>('/auth/refresh', data);
  },

  getCurrentUser: async (): Promise<CurrentUser> => {
    return apiGet<CurrentUser>('/auth/me');
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    return apiPost<void>('/auth/change-password', data);
  },
};

export default authApi;
