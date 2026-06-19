import { Link, useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard,
  CalendarDays,
  Ticket,
  AlertTriangle,
  BarChart3,
  Menu,
  X,
  User,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'
import { Outlet } from '@tanstack/react-router'
import { cn } from '@/utils'
import { useOperator } from '@/context/OperatorContext'

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
  const [operatorDropdownOpen, setOperatorDropdownOpen] = useState(false)
  const { currentOperator, setCurrentOperator, operatorUsers } = useOperator()

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 移动端顶部栏 */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4">
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="ml-3 text-lg font-semibold text-gray-800">门票预约跟进台</h1>
        </div>
        <div className="flex items-center">
          <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
            <User size={14} className="text-primary-600" />
          </div>
        </div>
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

        {/* 处理人选择 */}
        <div className="hidden lg:block p-4 border-t border-gray-200 mt-auto">
          <div className="relative">
            <button
              onClick={() => setOperatorDropdownOpen(!operatorDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User size={14} className="text-primary-600" />
                </div>
                <div className="ml-2 text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {currentOperator?.full_name || currentOperator?.username || '未选择'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {currentOperator?.role === 'admin' && '管理员'}
                    {currentOperator?.role === 'operator' && '票务专员'}
                    {currentOperator?.role === 'supervisor' && '运营主管'}
                  </p>
                </div>
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            {operatorDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                {operatorUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setCurrentOperator(user)
                      setOperatorDropdownOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 transition-colors',
                      currentOperator?.id === user.id && 'bg-primary-50'
                    )}
                  >
                    <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                      <User size={12} className="text-primary-600" />
                    </div>
                    <div className="ml-2">
                      <p className="text-sm font-medium text-gray-900">
                        {user.full_name || user.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.role === 'admin' && '管理员'}
                        {user.role === 'operator' && '票务专员'}
                        {user.role === 'supervisor' && '运营主管'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

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
        {/* 桌面端顶部栏 */}
        <div className="hidden lg:flex items-center justify-end px-6 py-3 bg-white border-b border-gray-100">
          <div className="relative">
            <button
              onClick={() => setOperatorDropdownOpen(!operatorDropdownOpen)}
              className="flex items-center px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                <User size={12} className="text-primary-600" />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-800">
                {currentOperator?.full_name || currentOperator?.username || '未选择'}
              </span>
              <ChevronDown size={14} className="ml-1.5 text-gray-400" />
            </button>
            {operatorDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50 min-w-[180px]">
                {operatorUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setCurrentOperator(user)
                      setOperatorDropdownOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 transition-colors',
                      currentOperator?.id === user.id && 'bg-primary-50'
                    )}
                  >
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                      <User size={11} className="text-primary-600" />
                    </div>
                    <div className="ml-2">
                      <p className="text-sm font-medium text-gray-900">
                        {user.full_name || user.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.role === 'admin' && '管理员'}
                        {user.role === 'operator' && '票务专员'}
                        {user.role === 'supervisor' && '运营主管'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
