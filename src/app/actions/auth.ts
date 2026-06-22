'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import type { UserRole } from '@/lib/utils';
import { USER_MAP, COOKIE_NAME } from '@/lib/auth-helpers';
import type { SessionUser } from '@/lib/auth-helpers';

export type { SessionUser };

export async function loginUser(email: string): Promise<{ ok: boolean; user?: SessionUser; error?: string }> {
  const user = USER_MAP[email.toLowerCase().trim()];
  if (!user) return { ok: false, error: '未找到该账号，请使用演示角色快速登录' };

  try {
    const exist = await prisma.user.findUnique({ where: { email: user.email } });
    if (!exist) {
      await prisma.user.create({ data: user });
    }
  } catch {
    // prisma 不可用时，继续用 cookie 登录
  }

  cookies().set({
    name: COOKIE_NAME,
    value: user.email,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  return { ok: true, user };
}

export async function logoutUser(): Promise<void> {
  cookies().delete(COOKIE_NAME);
  redirect('/login');
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const email = cookies().get(COOKIE_NAME)?.value ?? process.env.MOCK_USER_EMAIL;
  if (!email) return USER_MAP['management@company.com'] ?? null;
  return USER_MAP[email] ?? USER_MAP['management@company.com'] ?? null;
}

export async function requireUser(allowed?: UserRole[]): Promise<SessionUser> {
  const u = await getCurrentUser();
  if (!u) redirect('/login');
  if (allowed && !allowed.includes(u.role)) {
    redirect(u.role === 'EXECUTOR' ? '/my-tasks' : '/dashboard');
  }
  return u;
}

export async function switchRole(role: UserRole): Promise<SessionUser> {
  const target = Object.values(USER_MAP).find((u) => u.role === role) ?? USER_MAP['management@company.com']!;
  cookies().set({
    name: COOKIE_NAME,
    value: target.email,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });
  try {
    const exist = await prisma.user.findUnique({ where: { email: target.email } });
    if (!exist) await prisma.user.create({ data: target });
  } catch {
    // ignore
  }
  return target;
}
