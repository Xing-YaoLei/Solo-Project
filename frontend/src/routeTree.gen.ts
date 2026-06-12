import { createRouter, createRoute, createRootRoute, Outlet, Link, redirect } from '@tanstack/react-router'
import { Coffee, ClipboardList, BarChart3, PlusCircle } from 'lucide-react'
import { useState } from 'react'
import RecordsPage from '@/pages/RecordsPage'
import NewRecordPage from '@/pages/NewRecordPage'
import RecordDetailPage from '@/pages/RecordDetailPage'
import StatisticsPage from '@/pages/StatisticsPage'

function RootLayout() {
  const [activeMenu, setActiveMenu] = useState('records')

  const menuItems = [
    { key: 'records', label: '清洁单据', icon: ClipboardList, to: '/records' },
    { key: 'create', label: '新建单据', icon: PlusCircle, to: '/records/new' },
    { key: 'statistics', label: '数据统计', icon: BarChart3, to: '/statistics' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
          <div className="w-10 h-10 bg-coffee-700 rounded-lg flex items-center justify-center">
            <Coffee className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">清洁跟进台</h1>
            <p className="text-xs text-gray-500">连锁咖啡设备</p>
          </div>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              onClick={() => setActiveMenu(item.key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeMenu === item.key
                  ? 'bg-coffee-50 text-coffee-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              activeOptions={{ exact: false }}
              activeProps={{ className: '!bg-coffee-50 !text-coffee-900' }}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

const rootRoute = createRootRoute({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/records' })
  },
})

const recordsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/records',
  component: RecordsPage,
})

const newRecordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/records/new',
  component: NewRecordPage,
})

const recordDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/records/$recordId',
  component: RecordDetailPage,
})

const statisticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/statistics',
  component: StatisticsPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  recordsRoute,
  newRecordRoute,
  recordDetailRoute,
  statisticsRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
