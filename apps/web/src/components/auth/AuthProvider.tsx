'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getCurrentUser } from '@/lib/api/auth';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token, user, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    if (token && !user && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        useAuthStore.setState({ user: parsed });
      } catch (e) {
        console.error('Failed to parse user from localStorage');
      }
    }
  }, [token, user]);

  useEffect(() => {
    if (token && !user) {
      getCurrentUser()
        .then((fetchedUser) => {
          setAuth(token, fetchedUser);
        })
        .catch(() => {
          clearAuth();
          if (pathname !== '/login') {
            router.push('/login');
          }
        });
    }
  }, [token, user, setAuth, clearAuth, pathname, router]);

  return <>{children}</>;
}
