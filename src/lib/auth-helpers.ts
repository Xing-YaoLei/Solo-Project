import type { UserRole } from './utils';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string | null;
}

export const USER_MAP: Record<string, SessionUser> = {
  'management@company.com': {
    id: 'mgmt-001',
    email: 'management@company.com',
    name: '张明（合规总监）',
    role: 'MANAGEMENT',
    department: '合规部',
  },
  'executor@company.com': {
    id: 'exec-001',
    email: 'executor@company.com',
    name: '李华（财务主管）',
    role: 'EXECUTOR',
    department: '财务部',
  },
  'executor2@company.com': {
    id: 'exec-002',
    email: 'executor2@company.com',
    name: '陈伟（IT 主管）',
    role: 'EXECUTOR',
    department: '技术部',
  },
  'reviewer@company.com': {
    id: 'rev-001',
    email: 'reviewer@company.com',
    name: '王芳（审计经理）',
    role: 'REVIEWER',
    department: '审计部',
  },
};

export function canViewAnalytics(role: UserRole): boolean {
  return role === 'MANAGEMENT' || role === 'REVIEWER';
}

export function canViewImport(role: UserRole): boolean {
  return role === 'MANAGEMENT';
}

export function canViewAuditList(role: UserRole): boolean {
  return role === 'MANAGEMENT' || role === 'REVIEWER';
}

export function listDemoUsers(): Array<SessionUser & { hint: string }> {
  return [
    { ...USER_MAP['management@company.com']!, hint: '查看全局总览、KPI、分析图表与导入' },
    { ...USER_MAP['executor@company.com']!, hint: '只查看分配给您的整改项与首次解决率' },
    { ...USER_MAP['reviewer@company.com']!, hint: '复核整改结果、写复核注释退回或通过' },
  ];
}

export const COOKIE_NAME = 'session_user_email';
