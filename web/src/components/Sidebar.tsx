'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ADMIN_LINKS = [
  { href: '/admin/check-in-dicts', label: '核销字典' },
  { href: '/admin/refund-rules', label: '退款规则' },
  { href: '/admin/seat-maps', label: '座位图阈值' },
  { href: '/admin/events', label: '活动管理' },
  { href: '/admin/users', label: '人员管理' },
];

const BIZ_LINKS = [
  { href: '/biz/orders', label: '购票订单' },
  { href: '/biz/ticket-types', label: '票种规则' },
  { href: '/biz/disputes', label: '退票争议' },
  { href: '/biz/operation-logs', label: '操作记录' },
  { href: '/biz/statistics', label: '上座率复盘' },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <aside className="w-60 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-4 text-lg font-bold border-b border-gray-700">票务分派台</div>
      <nav className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-1 text-xs text-gray-400 uppercase">管理端</div>
        {ADMIN_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`block px-4 py-2 text-sm hover:bg-gray-800 ${isActive(l.href) ? 'bg-gray-800 border-l-2 border-blue-400' : ''}`}
          >
            {l.label}
          </Link>
        ))}
        <div className="px-4 pt-6 pb-1 text-xs text-gray-400 uppercase">业务侧</div>
        {BIZ_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`block px-4 py-2 text-sm hover:bg-gray-800 ${isActive(l.href) ? 'bg-gray-800 border-l-2 border-green-400' : ''}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
