'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Settings, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '漏斗报表', icon: LayoutDashboard },
  { href: '/patients', label: '患者管理', icon: Users },
  { href: '/notes', label: '备注任务', icon: FileText },
  { href: '/thresholds', label: '阈值配置', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-xl font-bold text-slate-800">正畸病例管理</h1>
        <p className="text-xs text-slate-500 mt-1">口腔诊所漏斗报表系统</p>
      </div>

      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <Users size={20} className="text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">管理员</p>
            <p className="text-xs text-slate-500">admin@clinic.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
