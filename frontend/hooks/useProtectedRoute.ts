'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import type { UserRole } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';

interface UseProtectedRouteOptions {
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function useProtectedRoute(options: UseProtectedRouteOptions = {}) {
  const { allowedRoles, redirectTo = '/login' } = options;
  const { isAuthenticated, hasRole, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const loginPath = `${redirectTo}?redirect=${encodeURIComponent(pathname)}`;
      router.replace(loginPath);
      return;
    }

    if (allowedRoles && !hasRole(allowedRoles)) {
      router.replace('/dashboard');
      return;
    }

    setIsAuthorized(true);
  }, [isAuthenticated, hasRole, isLoading, allowedRoles, redirectTo, router, pathname]);

  return {
    isLoading,
    isAuthorized,
    isAuthenticated,
  };
}

export default useProtectedRoute;
