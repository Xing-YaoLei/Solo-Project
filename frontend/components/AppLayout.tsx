'use client';

import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

const pageTitles: Record<string, string> = {
  '/dashboard': '仪表盘',
  '/work-orders': '工单管理',
  '/vehicles': '车辆管理',
  '/parts': '配件库存',
  '/part-requests': '配件申领',
  '/reminders': '保养提醒',
  '/statistics': '统计报表',
  '/settings': '系统设置',
};

function getPageTitle(pathname: string | null): string {
  if (!pathname) return '';
  if (pathname.startsWith('/work-orders/')) {
    return '工单详情';
  }
  return pageTitles[pathname] || '';
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pageTitle = getPageTitle(pathname);
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-slate-100">
      <aside className="hidden w-64 shrink-0 lg:block">
        <Sidebar />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <aside className="relative h-full w-64">
            <Sidebar />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar title={pageTitle} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export function AppLayoutWithProvider({ children }: AppLayoutProps) {
  return (
    <AuthProvider>
      <AppLayout>{children}</AppLayout>
    </AuthProvider>
  );
}

export default AppLayoutWithProvider;
