'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitCompare,
  AlertTriangle,
  Smile,
  Download,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/',
    label: '仪表板',
    icon: LayoutDashboard,
  },
  {
    href: '/data-compare',
    label: '数据对比',
    icon: GitCompare,
  },
  {
    href: '/conflicts',
    label: '利益冲突',
    icon: AlertTriangle,
  },
  {
    href: '/satisfaction',
    label: '满意度复盘',
    icon: Smile,
  },
  {
    href: '/export',
    label: '导出中心',
    icon: Download,
  },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-md">
          <Scale className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-lg font-bold text-primary-500">
            开庭日历报表
          </h1>
          <p className="text-xs text-slate-500">Court Calendar Funnel</p>
        </div>
      </div>

      <div className="space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary-50 text-primary-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5',
                  isActive ? 'text-primary-600' : 'text-slate-400'
                )}
              />
              {item.label}
              {isActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-primary-500" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
            管
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">管理员</p>
            <p className="text-xs text-slate-500">admin@lawfirm.com</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
