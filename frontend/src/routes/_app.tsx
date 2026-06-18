import { createFileRoute, Outlet, Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { LayoutDashboard, ClipboardList, Car, Package, AlertTriangle, BarChart3, LogOut, User } from 'lucide-react'
import { useEffect } from 'react'

const navItems = [
  { to: '/schedule', label: '工位排班', icon: LayoutDashboard },
  { to: '/records', label: '维修记录', icon: ClipboardList },
  { to: '/vehicles', label: '车辆档案', icon: Car },
  { to: '/inventory', label: '配件库存', icon: Package },
  { to: '/shortages', label: '缺货通知', icon: AlertTriangle },
  { to: '/reports', label: '月底复盘', icon: BarChart3 },
]

function Layout() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: '/login' })
    }
  }, [user, loading, navigate])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-60 bg-slate-900 text-white flex flex-col">
        <div className="px-5 py-5 border-b border-slate-800">
          <h1 className="text-lg font-bold">汽车维修管理</h1>
          <p className="text-xs text-slate-400 mt-1">工位排班跟进台</p>
        </div>
        <nav className="flex-1 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-primary-600 [&.active]:text-white"
                activeOptions={{ exact: false }}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <User size={16} />
            </div>
            <div>
              <p className="text-sm font-medium">{user.full_name}</p>
              <p className="text-xs text-slate-400">{user.role}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout()
              navigate({ to: '/login' })
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors"
          >
            <LogOut size={16} />
            退出登录
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

export const Route = createFileRoute('/_app')({
  component: Layout,
})
