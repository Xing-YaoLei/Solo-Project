'use client';

import { useEffect } from 'react';
import { useSession } from '@/store/session';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === 'EXECUTOR') {
      router.replace('/my-tasks');
    } else {
      router.replace('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
      正在跳转...
    </div>
  );
}
