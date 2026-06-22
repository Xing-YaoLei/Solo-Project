'use client';

import { create } from 'zustand';
import type { UserRole } from '@/lib/utils';
import { switchRole as switchRoleAction, loginUser } from '@/app/actions/auth';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string | null;
}

type SessionState = {
  user: SessionUser | null;
  loading: boolean;
  setUser: (user: SessionUser | null) => void;
  switchRole: (role: UserRole, refresh?: boolean) => Promise<void>;
  loginByEmail: (email: string) => Promise<{ ok: boolean; error?: string }>;
};

const FALLBACK: SessionUser = {
  id: 'mgmt-001',
  email: 'management@company.com',
  name: '张明（合规总监）',
  role: 'MANAGEMENT',
  department: '合规部',
};

const PRESETS: Record<UserRole, SessionUser> = {
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

function readFromStorage(): SessionUser {
  try {
    const raw = localStorage.getItem('session_user');
    if (raw) return JSON.parse(raw) as SessionUser;
  } catch {
    // ignore
  }
  return FALLBACK;
}

function writeToStorage(user: SessionUser | null) {
  try {
    if (user) localStorage.setItem('session_user', JSON.stringify(user));
    else localStorage.removeItem('session_user');
  } catch {
    // ignore
  }
}

export const useSession = create<SessionState>((set, get) => ({
  user: typeof window !== 'undefined' ? readFromStorage() : FALLBACK,
  loading: false,
  setUser: (user) => {
    writeToStorage(user);
    set({ user });
  },
  switchRole: async (role, refresh = true) => {
    set({ loading: true });
    try {
      let user: SessionUser = PRESETS[role] ?? FALLBACK;
      try {
        user = await switchRoleAction(role);
      } catch {
        user = PRESETS[role] ?? FALLBACK;
      }
      writeToStorage(user);
      set({ user });
      if (refresh) setTimeout(() => (window.location.href = user.role === 'EXECUTOR' ? '/my-tasks' : '/dashboard'), 150);
    } finally {
      set({ loading: false });
    }
  },
  loginByEmail: async (email) => {
    set({ loading: true });
    try {
      const r = await loginUser(email);
      if (!r.ok) return { ok: false, error: r.error };
      writeToStorage(r.user!);
      set({ user: r.user! });
      setTimeout(() => {
        window.location.href = r.user!.role === 'EXECUTOR' ? '/my-tasks' : '/dashboard';
      }, 150);
      return { ok: true };
    } finally {
      set({ loading: false });
    }
  },
}));
