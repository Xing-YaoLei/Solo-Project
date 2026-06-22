'use client';

import React, { useEffect } from 'react';
import { Layout, Spin } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { HeaderComponent } from './Header';
import { useAuthStore } from '@/store/auth';

const { Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, token, user, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && token && !user) {
      fetchProfile().catch(() => {});
    }
  }, [isAuthenticated, token, user, fetchProfile]);

  useEffect(() => {
    const publicPaths = ['/login'];
    const isPublicPath = publicPaths.some((path) => pathname === path);

    if (!isLoading && !isAuthenticated && !isPublicPath) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading || (isAuthenticated && !user)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout className="min-h-screen">
      <Sidebar />
      <Layout>
        <HeaderComponent />
        <Content className="p-6">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
