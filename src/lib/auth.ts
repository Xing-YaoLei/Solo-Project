import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { UserRole } from '@/lib/utils';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string | null;
}

const MOCK_USERS: CurrentUser[] = [
  {
    id: 'mgmt-001',
    email: 'management@company.com',
    name: '张明（合规总监）',
    role: 'MANAGEMENT',
    department: '合规部',
  },
  {
    id: 'exec-001',
    email: 'executor@company.com',
    name: '李华（财务主管）',
    role: 'EXECUTOR',
    department: '财务部',
  },
  {
    id: 'rev-001',
    email: 'reviewer@company.com',
    name: '王芳（审计经理）',
    role: 'REVIEWER',
    department: '审计部',
  },
  {
    id: 'exec-002',
    email: 'executor2@company.com',
    name: '陈伟（IT 主管）',
    role: 'EXECUTOR',
    department: '技术部',
  },
];

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
      if (dbUser) {
        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role as UserRole,
          department: dbUser.department,
        };
      }
      const mock = MOCK_USERS.find((m) => m.email === user.email);
      if (mock) return mock;
    }
  } catch {
    // fall through
  }

  const fallback = process.env.MOCK_USER_EMAIL
    ? MOCK_USERS.find((m) => m.email === process.env.MOCK_USER_EMAIL)
    : MOCK_USERS[0];
  return fallback ?? null;
}

export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export function canViewAnalytics(role: UserRole): boolean {
  return role === 'MANAGEMENT' || role === 'REVIEWER';
}

export function canViewImport(role: UserRole): boolean {
  return role === 'MANAGEMENT';
}

export function listMockUsers(): CurrentUser[] {
  return MOCK_USERS;
}

export function getMockUserById(id: string): CurrentUser | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}
