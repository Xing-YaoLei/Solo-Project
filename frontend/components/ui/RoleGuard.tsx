"use client";

import { ReactNode } from "react";
import { UserRole } from "@/lib/types";
import { useAuth } from "@/lib/context/AuthContext";

interface RoleGuardProps {
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  if (roles.includes(user.role)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
