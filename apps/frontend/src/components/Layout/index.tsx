import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !token && router.pathname !== '/login') {
      router.push('/login');
    }
  }, [token, router, isMounted]);

  if (!isMounted || !token) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  if (router.pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole={user?.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
