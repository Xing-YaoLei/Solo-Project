import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet, Navigate } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import './index.css'
import { useAuthStore, hasPermission } from './hooks/useAuthStore'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import WorkOrderList from './pages/WorkOrderList'
import WorkOrderDetail from './pages/WorkOrderDetail'
import Layout from './components/Layout'

const rootRoute = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  )
}

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
})

function ProtectedLayout() {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <Layout />
}

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: ProtectedLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: IndexRedirect,
})

function IndexRedirect() {
  const { user } = useAuthStore()
  if (user && hasPermission(user.role, 'manager')) {
    return <Navigate to="/dashboard" replace />
  }
  return <Navigate to="/work-orders" replace />
}

const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/dashboard',
  component: DashboardPage,
})

function DashboardPage() {
  const { user } = useAuthStore()
  if (!user || !hasPermission(user.role, 'manager')) {
    return <Navigate to="/work-orders" replace />
  }
  return <Dashboard />
}

const workOrdersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/work-orders',
  component: WorkOrderList,
})

const workOrderDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/work-orders/$orderId',
  component: WorkOrderDetailPage,
})

function WorkOrderDetailPage() {
  const params = workOrderDetailRoute.useParams()
  return <WorkOrderDetail orderId={Number(params.orderId)} />
}

const routeTree = rootRoute.addChildren([
  loginRoute,
  layoutRoute.addChildren([
    indexRoute,
    dashboardRoute,
    workOrdersRoute,
    workOrderDetailRoute,
  ]),
])

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
