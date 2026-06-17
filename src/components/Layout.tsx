import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Layers,
  AlertTriangle,
  BookmarkPlus,
  Menu,
  ChevronLeft,
  Sun,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: '结算趋势看板', icon: LayoutDashboard },
  { to: '/drilldown', label: '逐层下钻', icon: Layers },
  { to: '/rejection', label: '拒付备注任务', icon: AlertTriangle },
  { to: '/views', label: '筛选视图管理', icon: BookmarkPlus },
]

const VIEW_LABELS: Record<string, string> = {
  '/': '结算趋势看板',
  '/drilldown': '逐层下钻',
  '/rejection': '拒付备注任务',
  '/views': '筛选视图管理',
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const { morningMeetingMode, toggleMorningMeetingMode, savedViews, loadView } = useAppStore()
  const location = useLocation()
  const currentViewName = VIEW_LABELS[location.pathname] || '结算趋势看板'
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-teal-700 text-white transition-all duration-300 shrink-0',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <div className={cn('flex items-center h-14 border-b border-teal-600', collapsed ? 'justify-center' : 'px-5')}>
          {!collapsed && <span className="text-lg font-bold tracking-wide">康复医保结算</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'p-1.5 rounded hover:bg-teal-600 transition-colors',
              !collapsed && 'ml-auto',
            )}
          >
            {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-teal-500/40 text-white'
                    : 'text-teal-100 hover:bg-teal-600 hover:text-white',
                  collapsed && 'justify-center px-0',
                )
              }
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-gray-200 shrink-0">
          <h1 className="text-base font-semibold text-gray-800">{currentViewName}</h1>

          <div className="flex items-center gap-4">
            {/* Saved view selector */}
            <div className="relative">
              <button
                onClick={() => setViewDropdownOpen(!viewDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <BookmarkPlus size={15} />
                已保存视图
              </button>
              {viewDropdownOpen && savedViews.length > 0 && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                  {savedViews.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        loadView(v.id)
                        setViewDropdownOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 transition-colors"
                    >
                      {v.name}
                      {v.isShared && <span className="ml-2 text-xs text-teal-600">共享</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Morning meeting toggle */}
            <button
              onClick={toggleMorningMeetingMode}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                morningMeetingMode
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100',
              )}
            >
              <Sun size={15} />
              早会模式{morningMeetingMode ? ' ON' : ''}
            </button>
          </div>
        </header>

        {/* Morning meeting banner */}
        {morningMeetingMode && (
          <div className="flex items-center gap-2 px-6 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm font-medium">
            <Sun size={16} className="text-amber-500" />
            早会模式 - 当前视图: {currentViewName}
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
