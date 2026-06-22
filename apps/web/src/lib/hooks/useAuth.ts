'use client';

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter, usePathname } from 'next/navigation';
import type { LoginRequest } from '@/lib/api/auth';

export const useAuth = () => {
  const router = useRouter();
  const pathname = usePathname();

  const {
    token,
    user,
    permissions,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    fetchProfile,
    setUser,
    setToken,
    clearError,
    hasPermission,
    hasRole,
  } = useAuthStore();

  const handleLogin = useCallback(
    async (credentials: LoginRequest) => {
      await login(credentials);
      router.push('/dashboard');
    },
    [login, router],
  );

  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/login');
  }, [logout, router]);

  useEffect(() => {
    if (isAuthenticated && !user && token) {
      fetchProfile().catch(() => {});
    }
  }, [isAuthenticated, user, token, fetchProfile]);

  useEffect(() => {
    const publicPaths = ['/login'];
    const isPublicPath = publicPaths.some((path) => pathname === path);

    if (!isAuthenticated && !isPublicPath) {
      router.push('/login');
    }

    if (isAuthenticated && pathname === '/login') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, pathname, router]);

  return {
    token,
    user,
    permissions,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    logout: handleLogout,
    fetchProfile,
    setUser,
    setToken,
    clearError,
    hasPermission,
    hasRole,
  };
};
