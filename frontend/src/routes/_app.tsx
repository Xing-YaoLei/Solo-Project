import { createFileRoute, Outlet, Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { LayoutDashboard, ClipboardList, Car, Package, AlertTriangle, BarChart3, LogOut, User, Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '@/lib/api'

const navItems = [
  { to: '/schedule', label: '工位排班', icon: LayoutDashboard, key: 'schedule' },
  { to: '/records', label: '维修记录', icon: ClipboardList, key: 'records' },
  { to: '/vehicles', label: '车辆档案', icon: Car, key: 'vehicles' },
  { to: '/inventory', label: '配件库存', icon: Package, key: 'inventory' },
  { to: '/shortages', label: '缺货通知', icon: AlertTriangle, key: 'shortages' },
  { to: '/reports', label: '月底复盘', icon: BarChart3, key: 'reports' },
]

function Layout() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const [shortageCount, setShortageCount] = useState(0)
  const [showNotice, setShowNotice] = useState(false)

  const loadShortageCount = async () => {
    try {
      const res = await api.get('/shortages/summary/count', {
        params: { mine_only: user?.role === 'parts' },
      })
      const prev = shortageCount
      const next = res.data.open_count || 0
      if (next > prev && next > 0 && prev === 0) {
        setShowNotice(true)
        setTimeout(() => setShowNotice(false), 5000)
      }
      setShortageCount(next)
    } catch {}
  }

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: '/login' })
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (user) {
      loadShortageCount()
      const interval = setInterval(loadShortageCount, 15000)
      return () => clearInterval(interval)
    }
  }, [user])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-slate-50 relative">
      {showNotice && shortageCount > 0 && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <Bell size={18} />
          <div>
            <p className="text-sm font-medium">
              有 {shortageCount} 条缺货提醒
              {user.role === 'parts' ? '需要您处理' : ''}
            </p>
            <button
              className="text-xs text-red-100 underline mt-0.5"
              onClick={() => {
                setShowNotice(false)
                navigate({ to: '/shortages' })
              }}
            >
              立即查看 →
            </button>
          </div>
          <button
            className="ml-4 text-red-200 hover:text-white"
            onClick={() => setShowNotice(false)}
          >
            ✕
          </button>
        </div>
      )}

      <aside className="w-60 bg-slate-900 text-white flex flex-col">
        <div className="px-5 py-5 border-b border-slate-800">
          <h1 className="text-lg font-bold">汽车维修管理</h1>
          <p className="text-xs text-slate-400 mt-1">工位排班跟进台</p>
        </div>
        <nav className="flex-1 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isShortages = item.key === 'shortages'
            const showBadge = isShortages && shortageCount > 0
            return (
              <Link
                key={item.to}
                to={item.to}
                className="relative flex items-center gap-3 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-primary-600 [&.active]:text-white"
                activeOptions={{ exact: false }}
              >
                <div className="relative">
                  <Icon size={18} />
                  {showBadge && (
                    <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {shortageCount > 99 ? '99+' : shortageCount}
                    </span>
                  )}
                </div>
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="ml-auto">
                    <Bell size={14} className="text-red-400" />
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.full_name}</p>
              <p className="text-xs text-slate-400">
                {user.role === 'admin'
                  ? '管理员'
                  : user.role === 'technician'
                  ? '维修技师'
                  : user.role === 'parts'
                  ? '库管'
                  : user.role}
              </p>
            </div>
          </div>
          {shortageCount > 0 && user.role === 'parts' && (
            <div className="mb-3 bg-red-900/40 border border-red-800 rounded-md p-2 text-xs">
              <div className="flex items-center gap-1.5 text-red-300">
                <AlertTriangle size={12} />
                <span>{shortageCount} 条缺货待处理</span>
              </div>
            </div>
          )}
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
