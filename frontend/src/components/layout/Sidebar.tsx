import { Link, useLocation } from '@tanstack/react-router'
import { useAuthStore } from '../../store/useAuthStore'
import { ROLE_LABELS } from '../../types'

const menuConfig = [
  {
    to: '/dashboard',
    label: '工作台',
    icon: '📊',
    roles: ['admin', 'manager', 'lawyer', 'assistant', 'auditor'],
  },
  {
    to: '/documents',
    label: '文书管理',
    icon: '📄',
    roles: ['admin', 'manager', 'lawyer', 'assistant', 'auditor'],
  },
  {
    to: '/audit',
    label: '审核台',
    icon: '✅',
    roles: ['admin', 'manager', 'auditor'],
  },
  {
    to: '/stats',
    label: '统计报表',
    icon: '📈',
    roles: ['admin', 'manager'],
  },
]

export default function Sidebar() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const visibleMenus = menuConfig.filter(
    (m) => user && m.roles.includes(user.role),
  )

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">⚖️ 法律服务</div>
        <div className="sidebar-sub">文书归档跟进台</div>
      </div>

      <nav className="sidebar-nav">
        {visibleMenus.map((menu) => {
          const isActive =
            location.pathname === menu.to ||
            location.pathname.startsWith(menu.to + '/')
          return (
            <Link
              key={menu.to}
              to={menu.to}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <span>{menu.icon}</span>
              <span>{menu.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user-name">{user?.full_name || user?.username}</div>
        <div className="sidebar-user-role">
          {user ? ROLE_LABELS[user.role] : ''}
        </div>
        <button className="logout-btn" onClick={logout}>
          退出登录
        </button>
      </div>
    </aside>
  )
}
