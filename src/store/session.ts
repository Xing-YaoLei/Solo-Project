'use client';

import { create } from 'zustand';
import type { CurrentUser } from '@/lib/auth';
import type { UserRole } from '@/lib/utils';

type SessionState = {
  user: CurrentUser | null;
  setUser: (user: CurrentUser | null) => void;
  switchRole: (role: UserRole) => void;
};

const FALLBACK: CurrentUser = {
  id: 'mgmt-001',
  email: 'management@company.com',
  name: '张明（合规总监）',
  role: 'MANAGEMENT',
  department: '合规部',
};

const PRESETS: Record<UserRole, CurrentUser> = {
  MANAGEMENT: FALLBACK,
  EXECUTOR: {
    id: 'exec-001',
    email: 'executor@company.com',
    name: '李华（财务主管）',
    role: 'EXECUTOR',
    department: '财务部',
  },
  REVIEWER: {
    id: 'rev-001',
    email: 'reviewer@company.com',
    name: '王芳（审计经理）',
    role: 'REVIEWER',
    department: '审计部',
  },
};

export const useSession = create<SessionState>((set, get) => ({
  user: typeof window !== 'undefined'
    ? (() => {
        try {
          const raw = localStorage.getItem('session_user');
          return raw ? (JSON.parse(raw) as CurrentUser) : FALLBACK;
        } catch {
          return FALLBACK;
        }
      })()
    : FALLBACK,
  setUser: (user) => {
    set({ user });
    try {
      if (user) localStorage.setItem('session_user', JSON.stringify(user));
      else localStorage.removeItem('session_user');
    } catch {
      // ignore
    }
  },
  switchRole: (role) => {
    const user = PRESETS[role] ?? FALLBACK;
    get().setUser(user);
  },
}));
