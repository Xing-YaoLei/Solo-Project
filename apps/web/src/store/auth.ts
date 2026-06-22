import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, UserRole, Permission } from '@/lib/api/types';
import { authApi, LoginRequest } from '@/lib/api/auth';
import { rolePermissions } from '@/lib/utils/permissions';

interface AuthState {
  token: string | null;
  user: User | null;
  permissions: Permission[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string | null) => void;
  clearError: () => void;
  hasPermission: (permission: Permission | Permission[]) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const computePermissions = (user: User | null): Permission[] => {
  if (!user) return [];
  return rolePermissions[user.role] || [];
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(credentials);
          const permissions = computePermissions(response.user);
          set({
            token: response.accessToken,
            user: response.user,
            permissions,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : '登录失败';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch {
        } finally {
          set({
            token: null,
            user: null,
            permissions: [],
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_info');
          }
        }
      },

      fetchProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const user = await authApi.getProfile();
          const permissions = computePermissions(user);
          set({
            user,
            permissions,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : '获取用户信息失败';
          set({
            error: message,
            isLoading: false,
            token: null,
            user: null,
            permissions: [],
            isAuthenticated: false,
          });
          throw error;
        }
      },

      setUser: (user: User) => {
        const permissions = computePermissions(user);
        set({ user, permissions });
      },

      setToken: (token: string | null) => {
        set({ token, isAuthenticated: !!token });
      },

      clearError: () => {
        set({ error: null });
      },

      hasPermission: (permission: Permission | Permission[]) => {
        const { permissions } = get();
        if (Array.isArray(permission)) {
          return permission.some((p) => permissions.includes(p));
        }
        return permissions.includes(permission);
      },

      hasRole: (role: UserRole | UserRole[]) => {
        const { user } = get();
        if (!user) return false;
        if (Array.isArray(role)) {
          return role.includes(user.role);
        }
        return user.role === role;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
