'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import AppLayout from './AppLayout';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('access_token');
      if (!isAuthenticated && !storedToken && !token) {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, token, router]);

  if (typeof window !== 'undefined') {
    const storedToken = localStorage.getItem('access_token');
    if (!isAuthenticated && !storedToken && !token) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      );
    }
  }

  return <AppLayout>{children}</AppLayout>;
}
