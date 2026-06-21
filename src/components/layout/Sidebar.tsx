'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  PieChart,
  Ticket,
  Lock,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  {
    href: '/',
    label: '数据概览',
    icon: LayoutDashboard,
  },
  {
    href: '/seat-trend',
    label: '座位图趋势',
    icon: TrendingUp,
  },
  {
    href: '/order-composition',
    label: '订单构成',
    icon: PieChart,
  },
  {
    href: '/ticket-types',
    label: '票种明细',
    icon: Ticket,
  },
  {
    href: '/lock-records',
    label: '锁座记录',
    icon: Lock,
  },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-neutral-800 bg-background-dark transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-neutral-800 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Ticket className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-white">票务看板</span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Ticket className="h-5 w-5 text-white" />
          </div>
        )}
        <button
          onClick={onToggle}
          className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </button>
      </div>

      <nav className="mt-4 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white',
                collapsed && 'justify-center px-0'
              )}
            >
              <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} />
              {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
              {!collapsed && isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="absolute bottom-4 left-2 right-2">
          <div className="rounded-lg bg-neutral-800/50 p-3">
            <p className="text-xs text-neutral-500">数据来源</p>
            <p className="mt-1 text-xs text-neutral-400">报名表 · 支付流水 · 票务平台</p>
          </div>
        </div>
      )}
    </aside>
  );
}
