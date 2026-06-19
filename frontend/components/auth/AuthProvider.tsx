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
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
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
      authStorage.setToken(response.token);
      authStorage.setUser(response.user);
      setToken(response.token);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout().catch(() => {});
    } finally {
      authStorage.clearAuth();
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const checkRole = useCallback(
    (roles: UserRole[]) => hasRole(user?.role || null, roles),
    [user]
  );

  const refreshUser = useCallback(async () => {
    try {
      const updatedUser = await authApi.getProfile();
      authStorage.setUser(updatedUser);
      setUser(updatedUser);
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
