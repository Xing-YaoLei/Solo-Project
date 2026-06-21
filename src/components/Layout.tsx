import { useState } from 'react'
import { Outlet, Link, useMatches } from '@tanstack/react-router'
import {
  Home, FileText, MessageSquare, Receipt, ListTodo,
  Shield, Camera, BarChart3, Wallet,
  ChevronLeft, ChevronRight, ChevronDown,
  Sun, Moon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useTheme } from '@/hooks/useTheme'
import type { UserRole } from '@/types'

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'operator', label: '运营专员' },
  { value: 'customer_service', label: '客服' },
  { value: 'rider', label: '骑手' },
  { value: 'city_manager', label: '城市经理' },
  { value: 'frontline', label: '一线人员' },
]

interface NavItem {
  label: string
  icon: React.ElementType
  path: string
  children?: { label: string; path: string }[]
}

const MAIN_NAV: NavItem[] = [
  { label: '工作台', icon: Home, path: '/' },
  { label: '补贴规则', icon: FileText, path: '/subsidy-rules' },
  { label: '申诉中心', icon: MessageSquare, path: '/appeals' },
  { label: '结算明细', icon: Receipt, path: '/settlements' },
  { label: '待办池', icon: ListTodo, path: '/todo-pool' },
]

const SECONDARY_NAV: NavItem[] = [
  { label: '赔付配置', icon: Shield, path: '/compensations' },
  { label: '核验照片', icon: Camera, path: '/photos' },
]

const REPORT_NAV: NavItem = {
  label: '报表中心',
  icon: BarChart3,
  path: '/reports/dispatch-duration',
  children: [
    { label: '派单时长', path: '/reports/dispatch-duration' },
    { label: '补贴汇总', path: '/reports/subsidy-summary' },
    { label: '绩效报表', path: '/reports/performance' },
  ],
}

const RIDER_NAV: NavItem[] = [
  { label: '我的补贴', icon: Wallet, path: '/rider/subsidies' },
  { label: '我的申诉', icon: MessageSquare, path: '/rider/appeals' },
]

function Sidebar() {
  const { sidebarCollapsed } = useUIStore()
  const { toggleSidebar } = useUIStore()
  const matches = useMatches()
  const currentPath = matches[matches.length - 1]?.id ?? ''
  const [reportOpen, setReportOpen] = useState(true)
  const { currentRole } = useAuthStore()
  const isRider = currentRole === 'rider'

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/'
    return currentPath.startsWith(path)
  }

  const navLinkClass = (path: string) =>
    cn(
      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
      isActive(path)
        ? 'bg-primary-700 text-white dark:bg-primary-600'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
    )

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-surface-border bg-white transition-all duration-200 dark:bg-slate-800',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-surface-border px-4">
        {!sidebarCollapsed && <span className="text-lg font-bold text-primary-700 dark:text-primary-400">补贴管理</span>}
        <button onClick={toggleSidebar} className="rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {isRider ? (
          RIDER_NAV.map((item) => (
            <Link key={item.path} to={item.path} className={navLinkClass(item.path)}>
              <item.icon size={20} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          ))
        ) : (
          <>
            {MAIN_NAV.map((item) => (
              <Link key={item.path} to={item.path} className={cn(navLinkClass(item.path), 'mb-0.5')}>
                <item.icon size={20} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            ))}

            <div className="my-2 border-t border-surface-border" />

            {SECONDARY_NAV.map((item) => (
              <Link key={item.path} to={item.path} className={cn(navLinkClass(item.path), 'mb-0.5')}>
                <item.icon size={20} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            ))}

            <div className="my-2 border-t border-surface-border" />

            {!sidebarCollapsed ? (
              <div>
                <button
                  onClick={() => setReportOpen(!reportOpen)}
                  className={cn('flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm', isActive(REPORT_NAV.path) ? 'text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300')}
                >
                  <BarChart3 size={20} />
                  <span className="flex-1 text-left">{REPORT_NAV.label}</span>
                  <ChevronDown size={16} className={cn('transition-transform', reportOpen && 'rotate-180')} />
                </button>
                {reportOpen && REPORT_NAV.children!.map((child) => (
                  <Link key={child.path} to={child.path} className={cn(navLinkClass(child.path), 'ml-8 mb-0.5')}>
                    <span>{child.label}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <Link to={REPORT_NAV.path} className={navLinkClass(REPORT_NAV.path)}>
                <BarChart3 size={20} />
              </Link>
            )}
          </>
        )}
      </nav>
    </aside>
  )
}

function Header() {
  const { sidebarCollapsed } = useUIStore()
  const { toggleSidebar } = useUIStore()
  const matches = useMatches()
  const { theme, toggleTheme } = useTheme()
  const { currentUser, currentRole, setRole } = useAuthStore()
  const [roleOpen, setRoleOpen] = useState(false)

  const breadcrumb = matches
    .filter((m) => m.id !== '__root__')
    .map((m) => {
      const segments = m.id.split('/').filter(Boolean)
      return segments[segments.length - 1] || '首页'
    })
    .join(' / ')

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-20 flex h-14 items-center justify-between border-b border-surface-border bg-white px-4 transition-all duration-200 dark:bg-slate-800',
        sidebarCollapsed ? 'left-16' : 'left-60'
      )}
    >
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden">
          <ChevronRight size={18} />
        </button>
        <span className="text-sm text-slate-500 dark:text-slate-400">{breadcrumb}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setRoleOpen(!roleOpen)}
            className="flex items-center gap-1.5 rounded-md border border-surface-border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {ROLES.find((r) => r.value === currentRole)?.label}
            <ChevronDown size={14} />
          </button>
          {roleOpen && (
            <div className="absolute right-0 top-full mt-1 w-32 rounded-md border border-surface-border bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => { setRole(r.value); setRoleOpen(false) }}
                  className={cn(
                    'block w-full px-3 py-1.5 text-left text-sm',
                    r.value === currentRole ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-sm text-slate-600 dark:text-slate-300">{currentUser?.display_name}</span>

        <button
          onClick={toggleTheme}
          className="rounded-md p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}

export default function Layout() {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="min-h-screen bg-surface dark:bg-slate-900">
      <Sidebar />
      <Header />
      <main
        className={cn(
          'pt-14 transition-all duration-200',
          sidebarCollapsed ? 'pl-16' : 'pl-60'
        )}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
