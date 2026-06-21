import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrentUser, UserRole, TokenResponse } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;
  user: CurrentUser | null;
  login: (tokens: TokenResponse, user: CurrentUser) => void;
  logout: () => void;
  updateTokens: (tokens: TokenResponse) => void;
  setUser: (user: CurrentUser) => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  canAccess: (permission: string) => boolean;
  isTokenExpired: () => boolean;
  clearAuth: () => void;
}

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  partner: [
    'view_all_cases',
    'view_all_invoices',
    'manage_users',
    'export_data',
    'share_reports',
    'manage_settings',
    'view_analytics',
    'approve_payments',
  ],
  lawyer: [
    'view_own_cases',
    'view_own_invoices',
    'create_invoice',
    'export_own_data',
    'share_own_reports',
  ],
  assistant: [
    'view_own_cases',
    'view_own_invoices',
    'create_invoice',
  ],
  client: [
    'view_own_cases',
    'view_own_invoices',
  ],
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      user: null,

      login: (tokens: TokenResponse, user: CurrentUser) => {
        const expiresAt = Date.now() + tokens.expires_in * 1000;
        set({
          isAuthenticated: true,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: expiresAt,
          user,
        });
      },

      logout: () => {
        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          tokenExpiresAt: null,
          user: null,
        });
      },

      updateTokens: (tokens: TokenResponse) => {
        const expiresAt = Date.now() + tokens.expires_in * 1000;
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: expiresAt,
        });
      },

      setUser: (user: CurrentUser) => {
        set({ user });
      },

      hasRole: (roles: UserRole | UserRole[]) => {
        const { user } = get();
        if (!user) return false;
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.role);
      },

      canAccess: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        const permissions = ROLE_PERMISSIONS[user.role] || [];
        return permissions.includes(permission);
      },

      isTokenExpired: () => {
        const { tokenExpiresAt } = get();
        if (!tokenExpiresAt) return true;
        return Date.now() >= tokenExpiresAt;
      },

      clearAuth: () => {
        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          tokenExpiresAt: null,
          user: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tokenExpiresAt: state.tokenExpiresAt,
        user: state.user,
      }),
    }
  )
);

export const selectAccessToken = (state: AuthState) => state.accessToken;
export const selectRefreshToken = (state: AuthState) => state.refreshToken;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectUser = (state: AuthState) => state.user;
export const selectUserRole = (state: AuthState) => state.user?.role;
export const selectHasRole = (state: AuthState) => state.hasRole;
export const selectCanAccess = (state: AuthState) => state.canAccess;
export const selectLogin = (state: AuthState) => state.login;
export const selectLogout = (state: AuthState) => state.logout;
export const selectUpdateTokens = (state: AuthState) => state.updateTokens;
export const selectIsTokenExpired = (state: AuthState) => state.isTokenExpired;
