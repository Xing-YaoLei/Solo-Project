import { Link, useNavigate, Outlet } from '@tanstack/react-router'
import { useAuthStore } from '@/hooks/useAuthStore'
import { roleLabels } from '@/utils/constants'
import { hasPermission } from '@/hooks/useAuthStore'
import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  Building2,
  User,
} from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  const isManager = user ? hasPermission(user.role, 'manager') : false

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Building2 className="w-8 h-8 text-primary-600" />
          <span className="ml-3 text-lg font-bold text-gray-800">
            物业报修系统
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {isManager && (
            <Link
              to="/dashboard"
              className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 hover:text-primary-600 transition-colors [&.active]:bg-primary-50 [&.active]:text-primary-600 [&.active]:font-medium"
              activeOptions={{ exact: true }}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="ml-3">数据看板</span>
            </Link>
          )}

          <Link
            to="/work-orders"
            className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 hover:text-primary-600 transition-colors [&.active]:bg-primary-50 [&.active]:text-primary-600 [&.active]:font-medium"
          >
            <ClipboardList className="w-5 h-5" />
            <span className="ml-3">工单列表</span>
          </Link>
        </nav>

        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-800">{user?.full_name}</p>
              <p className="text-xs text-gray-500">{user ? roleLabels[user.role] : ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="ml-2 text-sm">退出登录</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
