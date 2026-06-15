'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileCheck,
  Building2,
  Users,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  {
    label: '总览看板',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: '成绩复核分析',
    href: '/review-analysis',
    icon: FileCheck,
  },
  {
    label: '教室利用率',
    href: '/classroom-utilization',
    icon: Building2,
  },
  {
    label: '学生名单',
    href: '/student-list',
    icon: Users,
  },
  {
    label: '异常点分析',
    href: '/anomaly-analysis',
    icon: AlertTriangle,
  },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-primary-800 to-primary-900 text-white shadow-2xl z-50">
      <div className="p-6 border-b border-primary-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg leading-tight">教务成绩复核</h1>
            <p className="text-xs text-primary-300">趋势分析看板</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/50'
                  : 'text-primary-200 hover:bg-primary-700/50 hover:text-white'
              )}
            >
              <Icon
                className={clsx(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-white' : 'text-primary-400 group-hover:text-white'
                )}
              />
              <span className="font-medium text-sm">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-700">
        <div className="bg-primary-700/50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-sm font-medium">
              管
            </div>
            <div>
              <p className="text-sm font-medium">教务处管理员</p>
              <p className="text-xs text-primary-300">admin@university.edu</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
