import { useState } from 'react'
import { Outlet, Link as RouterLink, useLocation } from '@tanstack/react-router'
import { useAppStore } from '../store'

interface MenuItem {
  label: string
  icon: string
  path?: string
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    label: '数据汇总',
    icon: '📊',
    path: '/dashboard',
  },
  {
    label: '单据管理',
    icon: '📋',
    children: [
      { label: '全部单据', icon: '📄', path: '/tickets' },
      { label: '新建单据', icon: '➕', path: '/tickets/new' },
      { label: '补资料池', icon: '📝', path: '/tickets/status/supplement' },
      { label: '升级复核池', icon: '⬆️', path: '/tickets/status/escalated' },
      { label: '已完成', icon: '✅', path: '/tickets/status/completed' },
    ],
  },
  {
    label: '会员档案',
    icon: '👥',
    path: '/members',
  },
  {
    label: '权益规则',
    icon: '🎁',
    path: '/benefits',
  },
  {
    label: '账户流水',
    icon: '💰',
    path: '/transactions',
  },
  {
    label: '抄袭处理',
    icon: '⚠️',
    children: [
      { label: '抄袭案例', icon: '📋', path: '/plagiarism' },
      { label: '新建案例', icon: '➕', path: '/plagiarism/new' },
    ],
  },
]

function isActive(path: string, locationPath: string): boolean {
  if (path === locationPath) return true
  if (path !== '/' && locationPath.startsWith(path)) return true
  return false
}

function hasActiveChild(item: MenuItem, locationPath: string): boolean {
  if (!item.children) return false
  return item.children.some(
    (child) => child.path && isActive(child.path, locationPath)
  )
}

export default function Layout() {
  const location = useLocation()
  const { user } = useAppStore()
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    单据管理: true,
    抄袭处理: true,
  })

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }))
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-700">
          <h1 className="text-lg font-bold">社群跟进管理台</h1>
          <p className="text-xs text-gray-400 mt-1">职业教育运营系统</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {menuItems.map((item) => {
            if (item.children) {
              const isExpanded = expandedMenus[item.label] ?? false
              const childActive = hasActiveChild(item, location.pathname)

              return (
                <div key={item.label} className="mb-1">
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                      childActive
                        ? 'bg-gray-800 text-blue-400'
                        : 'hover:bg-gray-800 text-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    <span
                      className={`text-xs transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    >
                      ▶
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="bg-gray-950">
                      {item.children.map((child) => {
                        const active =
                          child.path && isActive(child.path, location.pathname)
                        return (
                          <RouterLink
                            key={child.label}
                            to={child.path as string}
                            className={`flex items-center gap-3 pl-12 pr-4 py-2.5 text-sm transition-colors ${
                              active
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                            }`}
                          >
                            <span className="text-base">{child.icon}</span>
                            <span>{child.label}</span>
                          </RouterLink>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            const active = item.path && isActive(item.path, location.pathname)
            return (
              <RouterLink
                key={item.label}
                to={item.path as string}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </RouterLink>
            )
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">
            职业教育学员社群跟进台
          </h2>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {user?.full_name || user?.username || '未登录'}
            </span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
              {(user?.full_name || user?.username || 'A')
                .charAt(0)
                .toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
