'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Filter,
  Kanban,
  Upload,
  FileText,
  ListTodo,
  Share2,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: '仪表盘', icon: LayoutDashboard },
  { href: '/filter', label: '筛选查询', icon: Filter },
  { href: '/kanban', label: '看板视图', icon: Kanban },
  { href: '/upload', label: '数据导入', icon: Upload },
  { href: '/reports', label: '报告生成', icon: FileText },
  { href: '/tasks', label: '整改任务', icon: ListTodo },
  { href: '/share', label: '协同共享', icon: Share2 },
  { href: '/settings', label: '系统设置', icon: Settings },
]

const Sidebar: React.FC = () => {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-navy-900 text-white">
      <div className="flex h-16 items-center gap-2 border-b border-navy-700 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600">
          <FileText className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold tracking-wide">合规审计</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-l-[3px] border-amber-600 bg-navy-800 text-white'
                  : 'text-slate-300 hover:bg-navy-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-navy-700 p-4">
        <p className="text-xs text-slate-400">v1.0.0</p>
      </div>
    </aside>
  )
}

export default Sidebar
