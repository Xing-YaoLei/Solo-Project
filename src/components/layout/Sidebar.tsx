import {
  LayoutDashboard,
  CheckSquare,
  ListChecks,
  BarChart3,
  Upload,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import type { UserRole } from '@/lib/utils';
import { useSession } from '@/store/session';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

const NAV: NavItem[] = [
  {
    href: '/dashboard',
    label: '总览仪表盘',
    icon: LayoutDashboard,
    roles: ['MANAGEMENT', 'REVIEWER'],
  },
  {
    href: '/my-tasks',
    label: '我的整改',
    icon: CheckSquare,
    roles: ['MANAGEMENT', 'EXECUTOR', 'REVIEWER'],
  },
  {
    href: '/audits',
    label: '审计项',
    icon: ListChecks,
    roles: ['MANAGEMENT', 'EXECUTOR', 'REVIEWER'],
  },
  {
    href: '/analytics',
    label: '分析中心',
    icon: BarChart3,
    roles: ['MANAGEMENT', 'REVIEWER'],
  },
  {
    href: '/import',
    label: '数据导入中心',
    icon: Upload,
    roles: ['MANAGEMENT'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useSession();
  const items = NAV.filter((n) => user && n.roles.includes(user.role));

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-gradient-to-b from-brand-900 to-brand-800 text-slate-100 flex flex-col border-r border-brand-900/60">
      <div className="h-16 px-5 flex items-center gap-3 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center ring-1 ring-white/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white tracking-wide">合规审计</div>
          <div className="text-[11px] text-brand-300">整改跟踪监测</div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group',
                active
                  ? 'bg-white/15 text-white shadow-inner ring-1 ring-white/10'
                  : 'text-brand-100/80 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon
                className={cn(
                  'w-4.5 h-4.5 shrink-0 transition-transform',
                  active ? 'scale-105' : 'group-hover:scale-105',
                )}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/10">
        <div className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
          <div className="text-[11px] text-brand-300 mb-1">数据来源</div>
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-brand-100">权限日志</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-brand-100">ERP</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-brand-100">邮件</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
