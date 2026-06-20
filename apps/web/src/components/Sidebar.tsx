'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Ticket,
  ShoppingBag,
  Map,
  QrCode,
  HandCoins,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: '仪表盘', icon: LayoutDashboard, exact: true },
  { href: '/ticket-types', label: '票种规则', icon: Ticket },
  { href: '/orders', label: '购票订单', icon: ShoppingBag },
  { href: '/seats', label: '座位图', icon: Map },
  { href: '/check-in', label: '签到核销', icon: QrCode },
  { href: '/sponsors', label: '赞助清单', icon: HandCoins },
  { href: '/exceptions', label: '异常处理', icon: AlertTriangle },
  { href: '/exports', label: '报表导出', icon: FileSpreadsheet },
];

export default function Sidebar() {
  const path = usePathname() || '/';
  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-white border-r border-slate-200 flex flex-col">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-200">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold">
          演
        </div>
        <div>
          <div className="font-semibold text-slate-900 leading-none">票务分派台</div>
          <div className="text-xs text-slate-500 mt-0.5">演出/活动管理系统</div>
        </div>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((it) => {
          const active = it.exact ? path === it.href : path.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              <it.icon className="w-5 h-5 shrink-0" />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-200 text-xs text-slate-500">
        <div>技术栈：Next.js · NestJS · Prisma</div>
        <div>数据库：PostgreSQL · Redis</div>
      </div>
    </aside>
  );
}
