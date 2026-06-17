'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings as SettingsIcon,
  ChevronDown,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useAuthStore, useAppStore } from '@/stores'
import { Badge } from './ui/badge'
import { useEffect, useState } from 'react'
import { tasksApi } from '@/lib/api'

const roleViews = [
  { value: 'manager', label: '管家视图' },
  { value: 'maintenance', label: '维修员视图' },
  { value: 'finance', label: '财务视图' },
  { value: 'tenant', label: '租客视图' },
  { value: 'frontline', label: '一线处理视图' },
]

export function Header() {
  const { user, logout } = useAuthStore()
  const { currentView, setCurrentView, viewRole } = useAppStore()
  const router = useRouter()
  const [overdueCount, setOverdueCount] = useState(0)

  useEffect(() => {
    const fetchOverdue = async () => {
      try {
        const tasks = await tasksApi.getOverdueTasks({ viewRole })
        setOverdueCount(Array.isArray(tasks) ? tasks.length : 0)
      } catch (e) {
        console.error(e)
      }
    }
    fetchOverdue()
  }, [viewRole])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const currentViewLabel = roleViews.find((v) => v.value === currentView)?.label || '管家视图'

  return (
    <header className="flex h-16 items-center justify-between border-b px-6 bg-background">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-80">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索房源、租客、任务..."
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {currentViewLabel}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {roleViews.map((view) => (
              <DropdownMenuItem
                key={view.value}
                onClick={() => setCurrentView(view.value)}
              >
                {view.label}
                {currentView === view.value && (
                  <span className="ml-2 text-xs text-primary">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {overdueCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0 text-[10px]"
            >
              {overdueCount}
            </Badge>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium">{user?.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{user?.name}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              个人中心
            </DropdownMenuItem>
            <DropdownMenuItem>
              <SettingsIcon className="mr-2 h-4 w-4" />
              系统设置
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
