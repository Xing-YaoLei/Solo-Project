'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wrench,
  Car,
  Package,
  ClipboardList,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from '@/lib/utils';
import { roleLabels } from '@/lib/auth';
import type { UserRole } from '@/lib/types';

interface MenuItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    href: '/dashboard',
    label: '仪表盘',
    icon: LayoutDashboard,
    roles: ['advisor', 'technician', 'partsClerk', 'manager'],
  },
  {
    href: '/work-orders',
    label: '工单管理',
    icon: Wrench,
    roles: ['advisor', 'technician', 'manager'],
  },
  {
    href: '/vehicles',
    label: '车辆管理',
    icon: Car,
    roles: ['advisor', 'manager'],
  },
  {
    href: '/parts',
    label: '配件库存',
    icon: Package,
    roles: ['partsClerk', 'manager'],
  },
  {
    href: '/part-requests',
    label: '配件申领',
    icon: ClipboardList,
    roles: ['technician', 'partsClerk', 'manager'],
  },
  {
    href: '/reminders',
    label: '保养提醒',
    icon: Bell,
    roles: ['advisor', 'manager'],
  },
  {
    href: '/statistics',
    label: '统计报表',
    icon: BarChart3,
    roles: ['manager'],
  },
  {
    href: '/settings',
    label: '系统设置',
    icon: Settings,
    roles: ['manager'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const filteredMenuItems = menuItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      <div className="flex h-16 items-center justify-center border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">汽修管理系统</h1>
      </div>

      {user && (
        <div className="border-b border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-slate-400">
                {roleLabels[user.role as keyof typeof roleLabels]}
              </p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-1 p-2">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-700 p-2">
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
