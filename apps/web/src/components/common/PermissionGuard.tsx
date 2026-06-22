'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth';
import type { Permission, UserRole } from '@/lib/api/types';

interface PermissionGuardProps {
  permission?: Permission | Permission[];
  role?: UserRole | UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  mode?: 'all' | 'any';
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  role,
  children,
  fallback = null,
  mode = 'any',
}) => {
  const { hasPermission, hasRole } = useAuthStore();

  const checkPermission = (): boolean => {
    let hasPerm = true;
    let hasRoleCheck = true;

    if (permission) {
      if (Array.isArray(permission)) {
        if (mode === 'all') {
          hasPerm = permission.every((p) => hasPermission(p));
        } else {
          hasPerm = permission.some((p) => hasPermission(p));
        }
      } else {
        hasPerm = hasPermission(permission);
      }
    }

    if (role) {
      hasRoleCheck = hasRole(role);
    }

    if (permission && role) {
      if (mode === 'all') {
        return hasPerm && hasRoleCheck;
      }
      return hasPerm || hasRoleCheck;
    }

    return hasPerm && hasRoleCheck;
  };

  if (!checkPermission()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGuard;
