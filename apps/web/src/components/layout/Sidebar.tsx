'use client';

import {
  LayoutDashboard,
  FileText,
  ListTodo,
  BarChart3,
  Settings,
  Building2,
  Tags,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface MenuItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { label: '投诉任务分派台', href: '/dashboard', icon: LayoutDashboard },
  { label: '待办池', href: '/todo-pool', icon: ListTodo },
  { label: '报表分析', href: '/reports', icon: BarChart3 },
  {
    label: '系统设置',
    icon: Settings,
    children: [
      { label: '责任归属配置', href: '/settings/departments', icon: Building2 },
      { label: '问题标签管理', href: '/settings/tags', icon: Tags },
      { label: '敏感字段配置', href: '/settings/permissions', icon: ShieldCheck },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['系统设置']);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.label);
    const hasActiveChild =
      hasChildren && item.children?.some((child) => isActive(child.href));
    const active = isActive(item.href);

    return (
      <div key={item.label}>
        {item.href ? (
          <Link
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all',
              active
                ? 'bg-primary text-white font-medium'
                : 'text-slate-600 hover:bg-slate-100 hover:text-primary',
              level > 0 && 'ml-8'
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Link>
        ) : (
          <button
            onClick={() => toggleMenu(item.label)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all',
              hasActiveChild
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-slate-600 hover:bg-slate-100 hover:text-primary'
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </div>
            {hasChildren && (
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform',
                  isExpanded ? 'rotate-180' : ''
                )}
              />
            )}
          </button>
        )}
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 h-full bg-white border-r border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-primary">景区投诉系统</h1>
            <p className="text-xs text-slate-400">Complaint Platform</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>
    </aside>
  );
}
