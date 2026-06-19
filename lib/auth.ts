import type { UserRole, DataScope } from '@/types';
import { generateDataScope } from './mockData';

export interface AuthContext {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  } | null;
  dataScope: DataScope;
}

const MOCK_USERS: Record<UserRole, { email: string; name: string; role: UserRole }> = {
  admin: { email: 'admin@homestay.com', name: '系统管理员', role: 'admin' },
  manager: { email: 'manager@homestay.com', name: '张店长', role: 'manager' },
  supervisor: { email: 'supervisor@homestay.com', name: '李主管', role: 'supervisor' },
  investor: { email: 'investor@homestay.com', name: '王投资人', role: 'investor' },
};

export async function getAuthContext(): Promise<AuthContext> {
  const role = process.env.MOCK_ROLE as UserRole | undefined || 'admin';
  const user = MOCK_USERS[role];

  if (!user) {
    return {
      isAuthenticated: false,
      user: null,
      dataScope: generateDataScope('investor'),
    };
  }

  return {
    isAuthenticated: true,
    user: {
      id: `user-${role}`,
      ...user,
    },
    dataScope: generateDataScope(role),
  };
}

export async function login(email: string, password: string): Promise<AuthContext | null> {
  const roleMatch = Object.entries(MOCK_USERS).find(([_, user]) => user.email === email);
  if (roleMatch && password === 'password') {
    const [role, user] = roleMatch;
    return {
      isAuthenticated: true,
      user: {
        id: `user-${role}`,
        ...user,
        role: role as UserRole,
      },
      dataScope: generateDataScope(role as UserRole),
    };
  }
  return null;
}

export async function validateShareToken(token: string): Promise<{
  valid: boolean;
  authContext?: AuthContext;
  error?: string;
}> {
  if (token.length >= 16) {
    const role: UserRole = token.startsWith('admin') ? 'admin'
      : token.startsWith('manager') ? 'manager'
      : token.startsWith('supervisor') ? 'supervisor'
      : 'investor';

    const user = MOCK_USERS[role];
    return {
      valid: true,
      authContext: {
        isAuthenticated: true,
        user: {
          id: `share-${token}`,
          email: user.email,
          name: `${user.name}(分享链接)`,
          role,
        },
        dataScope: generateDataScope(role),
      },
    };
  }

  return {
    valid: false,
    error: '链接无效或已过期',
  };
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '系统管理员',
  manager: '店长',
  supervisor: '保洁主管',
  investor: '投资人',
};

export const ROLE_PERMISSIONS: Record<UserRole, {
  canViewAllHotels: boolean;
  canViewDetails: boolean;
  canExport: boolean;
  canShare: boolean;
  canAdjustSchedule: boolean;
}> = {
  admin: {
    canViewAllHotels: true,
    canViewDetails: true,
    canExport: true,
    canShare: true,
    canAdjustSchedule: true,
  },
  manager: {
    canViewAllHotels: false,
    canViewDetails: true,
    canExport: true,
    canShare: true,
    canAdjustSchedule: true,
  },
  supervisor: {
    canViewAllHotels: false,
    canViewDetails: true,
    canExport: false,
    canShare: false,
    canAdjustSchedule: true,
  },
  investor: {
    canViewAllHotels: true,
    canViewDetails: false,
    canExport: true,
    canShare: false,
    canAdjustSchedule: false,
  },
};
