'use client';

import { useAuth } from '@/lib/auth';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', label: '工作台', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', roles: ['ADMIN', 'MANAGER', 'PHARMACIST', 'CLERK'] },
  { href: '/replenishment', label: '补货单', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', roles: ['ADMIN', 'MANAGER', 'PHARMACIST', 'CLERK'] },
  { href: '/tasks', label: '回访任务', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', roles: ['ADMIN', 'MANAGER', 'PHARMACIST', 'CLERK'] },
  { href: '/verification', label: '处方核对', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', roles: ['ADMIN', 'MANAGER', 'PHARMACIST', 'CLERK'] },
  { href: '/tracking', label: '回访追踪', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', roles: ['ADMIN', 'MANAGER', 'PHARMACIST'] },
  { href: '/analytics', label: '回访趋势', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', roles: ['ADMIN', 'MANAGER'] },
];

export default function Sidebar() {
  const { user, logout, isManager } = useAuth();
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-surface-800 border-r border-surface-700 flex flex-col h-screen fixed left-0 top-0">
      <div className="px-6 py-5 border-b border-surface-700">
        <h1 className="text-lg font-bold text-surface-50">用药回访分派台</h1>
        <p className="text-xs text-surface-200 mt-1">药店连锁管理系统</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-primary-500/15 text-primary-400'
                : 'text-surface-200 hover:bg-surface-700 hover:text-surface-50'
            )}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
            </svg>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-surface-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-sm font-medium">
            {user?.name?.[0] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-50 truncate">{user?.name}</p>
            <p className="text-xs text-surface-200">{user?.storeName}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 text-sm text-surface-200 hover:text-red-400 hover:bg-surface-700 rounded-lg transition-colors"
        >
          退出登录
        </button>
      </div>
    </aside>
  );
}
