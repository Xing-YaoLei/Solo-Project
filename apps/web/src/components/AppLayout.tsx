'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  ClipboardCheck,
  AlertTriangle,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  PackageCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { USER_ROLE_MAP, cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      href: '/',
      label: '分派工作台',
      icon: <LayoutDashboard size={20} />,
    },
    {
      href: '/tasks',
      label: '核验任务',
      icon: <ClipboardCheck size={20} />,
    },
    {
      href: '/damages',
      label: '损坏处理',
      icon: <AlertTriangle size={20} />,
    },
    {
      href: '/riders',
      label: '骑手管理',
      icon: <Users size={20} />,
    },
    {
      href: '/dashboard',
      label: '活跃趋势',
      icon: <PackageCheck size={20} />,
    },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-0 lg:w-20 overflow-hidden',
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-gray-100 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white shrink-0">
            <PackageCheck size={22} />
          </div>
          <div
            className={cn(
              'ml-3 transition-opacity duration-200',
              !sidebarOpen && 'lg:opacity-0',
            )}
          >
            <div className="text-sm font-bold text-gray-900">核验分派台</div>
            <div className="text-xs text-gray-500">Errand Verification</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  !sidebarOpen && 'lg:justify-center',
                )}
              >
                <span className={cn(isActive && 'text-primary-600')}>{item.icon}</span>
                <span className={cn(!sidebarOpen && 'lg:hidden')}>{item.label}</span>
                {item.badge && (
                  <span
                    className={cn(
                      'ml-auto px-2 py-0.5 text-xs rounded-full bg-danger-500 text-white',
                      !sidebarOpen && 'lg:hidden',
                    )}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && sidebarOpen && (
                  <ChevronRight size={14} className="ml-auto text-primary-500" />
                )}
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            'p-3 border-t border-gray-100 shrink-0',
            !sidebarOpen && 'lg:p-2',
          )}
        >
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={cn(
                'w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors',
                !sidebarOpen && 'lg:justify-center',
              )}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className={cn('text-left flex-1 min-w-0', !sidebarOpen && 'lg:hidden')}>
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || '未登录'}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user ? USER_ROLE_MAP[user.role] : ''}
                </div>
              </div>
            </button>
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-100 py-1 animate-slide-up">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                >
                  <LogOut size={16} />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 gap-4 shrink-0 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900">
              {navItems.find((i) => i.href === pathname || (i.href !== '/' && pathname?.startsWith(i.href)))?.label || '工作台'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs bg-success-50 text-success-600 font-medium">
              ● 服务正常
            </span>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
