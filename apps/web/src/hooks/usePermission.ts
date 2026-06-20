'use client';

import { useMemo, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole, SensitiveFieldConfig } from '@scenic/shared';

export function usePermission() {
  const user = useAuthStore((state) => state.user);
  const role = user?.role;

  const hasRole = useCallback((requiredRole: UserRole | UserRole[]) => {
    if (!role) return false;
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role);
    }
    return role === requiredRole;
  }, [role]);

  const canViewSensitiveField = useCallback((config: SensitiveFieldConfig | undefined) => {
    if (!config || !role) return false;
    return config.roles.includes(role);
  }, [role]);

  const canAssign = useMemo(() => {
    if (!role) return false;
    return ['OPERATOR', 'SUPERVISOR'].includes(role);
  }, [role]);

  const canUpgrade = useMemo(() => {
    if (!role) return false;
    return ['OPERATOR', 'SUPERVISOR'].includes(role);
  }, [role]);

  const canClose = useMemo(() => {
    if (!role) return false;
    return ['SUPERVISOR'].includes(role);
  }, [role]);

  const canManageSettings = useMemo(() => {
    if (!role) return false;
    return ['SUPERVISOR'].includes(role);
  }, [role]);

  return {
    user,
    role,
    hasRole,
    canViewSensitiveField,
    canAssign,
    canUpgrade,
    canClose,
    canManageSettings,
  };
}
