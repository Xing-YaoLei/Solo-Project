'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AuthContext } from '@/lib/auth';
import type { UserRole } from '@/types';

interface AuthContextType {
  auth: AuthContext;
  setRole: (role: UserRole) => void;
  isLoading: boolean;
}

const AuthContextProvider = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthContext>({
    isAuthenticated: false,
    user: null,
    dataScope: {
      role: 'admin',
      timeRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
    },
  });
  const [isLoading, setIsLoading] = useState(true);

  const setRole = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/auth/switch-role?role=${role}`);
      const data = await res.json();
      if (data.success) {
        setAuth(data.data.auth);
      }
    } catch (error) {
      console.error('Failed to switch role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success) {
          setAuth(data.data.auth);
        }
      } catch (error) {
        console.error('Failed to fetch auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAuth();
  }, []);

  return (
    <AuthContextProvider.Provider value={{ auth, setRole, isLoading }}>
      {children}
    </AuthContextProvider.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContextProvider);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
