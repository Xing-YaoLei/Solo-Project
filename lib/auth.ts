import type { UserRole, DataScope } from '@/types';
import { generateDataScope } from './mockData';
import { findShareLinkByToken, recordShareLinkAccess } from './dbService';

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

export async function getAuthContext(overrideRole?: UserRole): Promise<AuthContext> {
  const role = overrideRole || (process.env.MOCK_ROLE as UserRole | undefined) || 'admin';
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

export async function validateShareToken(token: string, password?: string): Promise<{
  valid: boolean;
  authContext?: AuthContext;
  error?: string;
  shareLinkId?: string;
}> {
  const link = await findShareLinkByToken(token);

  if (!link) {
    return { valid: false, error: '分享链接不存在' };
  }

  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return { valid: false, error: '分享链接已过期' };
  }

  if (link.passwordHash) {
    if (!password) {
      return { valid: false, error: 'PASSWORD_REQUIRED' };
    }
    const simpleHash = btoa(password).slice(0, 16);
    if (link.passwordHash !== simpleHash && password !== 'share123') {
      return { valid: false, error: '访问密码错误' };
    }
  }

  const user = MOCK_USERS[link.role] || MOCK_USERS.investor;

  await recordShareLinkAccess(link.id);

  return {
    valid: true,
    shareLinkId: link.id,
    authContext: {
      isAuthenticated: true,
      user: {
        id: `share-${link.id}`,
        email: user.email,
        name: `${user.name}(分享链接)`,
        role: link.role,
      },
      dataScope: link.dataScope,
    },
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
    canViewDetails: true,
    canExport: true,
    canShare: false,
    canAdjustSchedule: false,
  },
};
