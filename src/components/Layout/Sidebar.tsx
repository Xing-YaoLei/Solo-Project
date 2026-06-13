'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  UserCircle,
  BarChart3,
  Upload,
  ClipboardList,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';

const navItems = [
  {
    label: '数据总览',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['MANAGER'],
  },
  {
    label: '我的订单',
    href: '/my-orders',
    icon: ClipboardList,
    roles: ['TECHNICIAN'],
  },
  {
    label: '数据分析',
    href: '/analytics',
    icon: BarChart3,
    roles: ['MANAGER'],
  },
  {
    label: '数据导入',
    href: '/import',
    icon: Upload,
    roles: ['MANAGER'],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasPermission } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const filteredNavItems = navItems.filter(item =>
    hasPermission(item.roles as any)
  );

  return (
    <aside className="w-64 min-h-screen bg-white/80 backdrop-blur-md border-r border-cream-200 flex flex-col">
      <div className="p-6 border-b border-cream-200">
        <h1 className="font-display text-2xl font-bold gradient-text">
          美业报表
        </h1>
        <p className="text-sm text-dark-500 mt-1">员工手牌管理系统</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {filteredNavItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn('nav-link w-full text-left', isActive && 'active')}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-cream-200">
        <div className="flex items-center gap-3 mb-4 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-medium">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-dark-700 truncate">{user?.name}</p>
            <p className="text-xs text-dark-500">
              {user?.role === 'MANAGER' ? '管理层' : '技师'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="nav-link w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-5 h-5" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
}
