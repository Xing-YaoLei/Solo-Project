'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Building2,
  Users,
  FileText,
  Wrench,
  Zap,
  ListTodo,
  DollarSign,
  BarChart3,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores'
import { Button } from './ui/button'

const sidebarItems = [
  { icon: Home, label: '工作台', href: '/dashboard' },
  { icon: ListTodo, label: '任务分派台', href: '/tasks' },
  { icon: Building2, label: '房源管理', href: '/properties' },
  { icon: Users, label: '租客档案', href: '/tenants' },
  { icon: FileText, label: '合同管理', href: '/contracts' },
  { icon: Wrench, label: '维修记录', href: '/maintenance' },
  { icon: Zap, label: '水电读数', href: '/utilities' },
  { icon: DollarSign, label: '财务管理', href: '/finance' },
  { icon: BarChart3, label: '数据报表', href: '/reports' },
  { icon: Settings, label: '系统设置', href: '/settings' },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()

  return (
    <aside
      className={cn(
        'flex h-screen flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!sidebarCollapsed && (
          <span className="text-lg font-bold text-sidebar-foreground">
            长租公寓管理
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="ml-auto"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                sidebarCollapsed && 'justify-center px-2'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
