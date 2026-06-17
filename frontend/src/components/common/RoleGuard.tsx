import React from 'react';
import { useStore, hasRole } from '../../store';
import { UserRole } from '../../types';

interface RoleGuardProps {
  roles: UserRole | UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({
  roles,
  children,
  fallback = null,
}) => {
  const user = useStore((state) => state.user);

  if (!user) {
    return <>{fallback}</>;
  }

  const hasAccess = hasRole(roles);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleGuard;
