'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ListTodo,
  Kanban,
  PlusCircle,
  Settings,
  BarChart3,
  Bell,
  User,
  Menu,
  X,
  FileText,
  Shield,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiEndpoints } from '@/lib/api';
import { UserRole } from '@solo/shared';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { href: '/', label: '仪表盘', icon: LayoutDashboard },
  { href: '/kanban', label: '任务看板', icon: Kanban },
  { href: '/orders', label: '售后列表', icon: ListTodo },
  { href: '/orders/new', label: '新建售后', icon: PlusCircle },
  {
    href: '/config',
    label: '规则配置',
    icon: Settings,
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    href: '/rules',
    label: '责任规则',
    icon: Shield,
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  { href: '/analysis', label: '复盘分析', icon: BarChart3 },
  { href: '/messages', label: '消息中心', icon: Bell },
  { href: '/logs', label: '操作日志', icon: History },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const initUser = async () => {
      let user = null;
      try {
        const users: any = await apiEndpoints.users.operators();
        const managers = users?.filter?.((u: any) => u.role === UserRole.MANAGER || u.role === UserRole.ADMIN) || [];
        const operators = users || [];
        user = managers[0] || operators[0] || {
          id: '0ef65860-5b23-4cc4-a2c2-ee0037a1c0bf',
          name: '系统管理员',
          email: 'admin@solo.com',
          role: UserRole.ADMIN,
          region: '总部',
        };
      } catch (e) {
        user = {
          id: '0ef65860-5b23-4cc4-a2c2-ee0037a1c0bf',
          name: '系统管理员',
          email: 'admin@solo.com',
          role: UserRole.ADMIN,
          region: '总部',
        };
      }
      setCurrentUser(user);
      localStorage.setItem('operatorId', user.id);

      const fetchUnread = async () => {
        try {
          const res: any = await apiEndpoints.reminders.unreadCount(user.id);
          setUnreadCount(res.count || 0);
        } catch (e) {
          console.log('Failed to fetch unread count');
        }
      };
      fetchUnread();
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    };
    initUser();
  }, []);

  const canAccess = (item: NavItem) => {
    if (!item.roles || !currentUser) return true;
    return item.roles.includes(currentUser.role);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white shadow-lg transition-all duration-300 lg:static',
          sidebarOpen ? 'w-64' : 'w-0 lg:w-20',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          {sidebarOpen ? (
            <h1 className="text-lg font-bold text-primary-600">售后退款分派台</h1>
          ) : (
            <span className="mx-auto text-xl font-bold text-primary-600">S</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.filter(canAccess).map((item) => {
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all',
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {currentUser && (
          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <User className="h-5 w-5" />
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{currentUser.name}</p>
                  <p className="truncate text-xs text-gray-500">{currentUser.region}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {navItems.find((item) => pathname.startsWith(item.href))?.label || '首页'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/messages"
              className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
