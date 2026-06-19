import { Link, useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard,
  CalendarDays,
  Ticket,
  AlertTriangle,
  BarChart3,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Outlet } from '@tanstack/react-router'
import { cn } from '@/utils'

const menuItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/reservations', label: '预约管理', icon: Ticket },
  { path: '/time-slots', label: '时段管理', icon: CalendarDays },
  { path: '/conflicts', label: '冲突处理', icon: AlertTriangle },
  { path: '/statistics', label: '数据统计', icon: BarChart3 },
]

export function Layout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 移动端顶部栏 */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-40 flex items-center px-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h1 className="ml-3 text-lg font-semibold text-gray-800">门票预约跟进台</h1>
      </div>

      {/* 侧边栏遮罩 */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-14 lg:h-16 flex items-center px-6 border-b border-gray-200">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <Ticket className="text-white" size={18} />
          </div>
          <span className="ml-3 text-lg font-semibold text-gray-800 hidden lg:block">
            门票预约跟进台
          </span>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive(item.path)
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon size={18} className="mr-3" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* 手机端快捷操作入口 */}
        <div className="lg:hidden p-4 border-t border-gray-200 mt-auto">
          <div className="text-xs text-gray-500 mb-2">快捷操作</div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/reservations"
              className="flex flex-col items-center justify-center p-3 bg-primary-50 rounded-lg text-primary-600"
              onClick={() => setSidebarOpen(false)}
            >
              <Ticket size={20} />
              <span className="text-xs mt-1">新增预约</span>
            </Link>
            <Link
              to="/conflicts"
              className="flex flex-col items-center justify-center p-3 bg-red-50 rounded-lg text-red-600"
              onClick={() => setSidebarOpen(false)}
            >
              <AlertTriangle size={20} />
              <span className="text-xs mt-1">冲突处理</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
