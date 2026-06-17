'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Users,
  Pill,
  DoorOpen,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

const navItems = [
  { href: '/', label: '首页', icon: Home },
  { href: '/elders', label: '老人档案', icon: Users },
  { href: '/medications', label: '用药提醒', icon: Pill },
  { href: '/visits', label: '探访记录', icon: DoorOpen },
  { href: '/activities', label: '活动签到', icon: CheckSquare },
  { href: '/falls', label: '跌倒事件', icon: AlertTriangle },
  { href: '/dashboard', label: '趋势看板', icon: TrendingUp },
]

export default function Sidebar() {
  const pathname = usePathname()
  const collapsed = useAppStore((s) => s.sidebarCollapsed)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 z-30 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="h-16 flex items-center justify-center border-b border-slate-700 px-4">
        <Pill className="w-6 h-6 text-teal-400 shrink-0" />
        {!collapsed && (
          <span className="ml-2 text-lg font-bold tracking-wide whitespace-nowrap">
            护理分派台
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                active
                  ? 'bg-teal-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium whitespace-nowrap">
                  {label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
