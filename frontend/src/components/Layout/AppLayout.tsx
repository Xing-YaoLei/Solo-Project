import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { ROLE_LABEL } from '@/types'
import { classNames } from '@/utils'

interface NavItem {
  label: string
  to: string
  icon: string
  match: (path: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: '首页', to: '/dashboard', icon: '📊', match: (p) => p.startsWith('/dashboard') },
  { label: '补货单', to: '/orders', icon: '📦', match: (p) => p.startsWith('/orders') },
  { label: '温度异常', to: '/alerts', icon: '🌡️', match: (p) => p.startsWith('/alerts') },
  { label: '统计分析', to: '/stats', icon: '📈', match: (p) => p.startsWith('/stats') },
  { label: '门店管理', to: '/basic/stores', icon: '🏪', match: (p) => p === '/basic/stores' },
  { label: '商品管理', to: '/basic/products', icon: '🥬', match: (p) => p === '/basic/products' },
  { label: '用户管理', to: '/basic/users', icon: '👥', match: (p) => p === '/basic/users' },
]

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    if (!useAuthStore.getState().user && useAuthStore.getState().token) {
      useAuthStore.getState().fetchMe().catch(() => {
        useAuthStore.getState().logout()
        navigate({ to: '/login' })
      })
    }
  }, [navigate])

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-slate-200">
          <span className="text-xl font-bold text-primary-700">❄️ 冷链补货</span>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = item.match(location.pathname)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={classNames(
                  'flex items-center px-5 py-2.5 text-sm font-medium transition-colors',
                  active ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                <span className="mr-3 text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-slate-800">
            {NAV_ITEMS.find((i) => i.match(location.pathname))?.label || '生鲜冷链门店补货跟进台'}
          </h1>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium">
                {user?.full_name?.charAt(0) || '?'}
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-slate-800">{user?.full_name || '-'}</div>
                <div className="text-xs text-slate-500">{user ? ROLE_LABEL[user.role] : ''}</div>
              </div>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  退出登录
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
