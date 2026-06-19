import React from 'react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuthStore, UserRole } from '@/store/auth';

interface WithAuthOptions {
  requiredRoles?: UserRole[];
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const { requiredRoles } = options;

  return function AuthenticatedComponent(props: P) {
    const router = useRouter();
    const { token, user, isLoading } = useAuthStore();

    useEffect(() => {
      if (!isLoading && !token) {
        router.push('/login');
        return;
      }

      if (requiredRoles && user && !requiredRoles.includes(user.role)) {
        router.push('/');
      }
    }, [token, user, isLoading, router, requiredRoles]);

    if (!token || isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-gray-500">加载中...</div>
        </div>
      );
    }

    if (requiredRoles && user && !requiredRoles.includes(user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">权限不足</div>
            <div className="text-gray-500">您没有权限访问此页面</div>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

export function hasRole(userRole: UserRole | undefined, requiredRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

export function isAdmin(role: UserRole | undefined): boolean {
  return role === 'ADMIN';
}

export function isManager(role: UserRole | undefined): boolean {
  return role === 'ADMIN' || role === 'MANAGER';
}

export function isFrontline(role: UserRole | undefined): boolean {
  return role === 'FRONTLINE';
}
