'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (user.role === 'MANAGER') {
          router.push('/dashboard');
        } else {
          router.push('/my-orders');
        }
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-100 to-cream-200">
      <div className="animate-spin w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full" />
    </div>
  );
}
