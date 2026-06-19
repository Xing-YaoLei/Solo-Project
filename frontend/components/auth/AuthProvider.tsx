'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, LoginRequest, UserRole } from '@/lib/types';
import { authStorage, hasRole } from '@/lib/auth';
import { authApi } from '@/lib/api-endpoints';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = authStorage.getToken();
    const storedUser = authStorage.getUser();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      const accessToken = response.accessToken;
      const userData = response.user;

      authStorage.setToken(accessToken);
      authStorage.setUser(userData);
      document.cookie = `token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      setToken(accessToken);
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authStorage.clearAuth();
    document.cookie = 'token=; path=/; max-age=0';
    setToken(null);
    setUser(null);
  }, []);

  const checkRole = useCallback(
    (roles: UserRole[]) => hasRole(user?.role?.code || null, roles),
    [user]
  );

  const checkPermission = useCallback(
    (permission: string) => {
      if (!user || !user.permissions) return false;
      return user.permissions.includes(permission);
    },
    [user]
  );

  const refreshUser = useCallback(async () => {
    try {
      const profileData = await authApi.getProfile();
      const userData: User = {
        id: profileData.id,
        username: profileData.username,
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        avatar: profileData.avatar,
        role: profileData.role,
        permissions: profileData.permissions,
      };
      authStorage.setUser(userData);
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    hasRole: checkRole,
    hasPermission: checkPermission,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
