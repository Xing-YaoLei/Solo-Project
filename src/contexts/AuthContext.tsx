'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (requiredRole: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'manager@beauty.com',
    name: '张店长',
    role: 'MANAGER',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    email: 'tech1@beauty.com',
    name: '李美容师',
    role: 'TECHNICIAN',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    email: 'tech2@beauty.com',
    name: '王美容师',
    role: 'TECHNICIAN',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    email: 'tech3@beauty.com',
    name: '陈美容师',
    role: 'TECHNICIAN',
    createdAt: new Date('2024-01-01'),
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser({
          ...parsed,
          createdAt: new Date(parsed.createdAt),
        });
      } catch (e) {
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const foundUser = MOCK_USERS.find(u => u.email === email);
    if (foundUser && password === '123456') {
      setUser(foundUser);
      localStorage.setItem('auth_user', JSON.stringify(foundUser));
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  const hasPermission = (requiredRole: UserRole[]): boolean => {
    if (!user) return false;
    return requiredRole.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
