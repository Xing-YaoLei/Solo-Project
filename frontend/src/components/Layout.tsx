import { Outlet, useRouter } from '@tanstack/react-router'
import { useAuthStore } from '../stores/auth'

interface MenuItem {
  path: string
  label: string
  icon: string
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: '工作台', icon: '📊' },
  { path: '/elders', label: '老人档案', icon: '👴' },
  { path: '/medications', label: '用药清单', icon: '💊' },
  { path: '/visits', label: '探访记录', icon: '👥' },
  { path: '/activities', label: '活动签到', icon: '🏃' },
  { path: '/risks', label: '风险事件', icon: '⚠️' },
  { path: '/incidents', label: '异常单', icon: '📋' },
  { path: '/exports', label: '数据导出', icon: '📤' },
  { path: '/audit', label: '审计日志', icon: '📝' },
]

export default function Layout() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const currentPath = router.state.location.pathname

  const handleLogout = () => {
    logout()
    router.navigate({ to: '/login' })
  }

  const isActive = (path: string) => {
    return currentPath.startsWith(path)
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>养老护理系统</h1>
        </div>
        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <div
              key={item.path}
              className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => router.navigate({ to: item.path })}
            >
              <span className="menu-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <h2>养老护理康复活动跟进系统</h2>
          </div>
          <div className="topbar-right">
            <div className="user-info">
              <div className="user-avatar">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <span>{user?.full_name || '用户'}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              退出
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
