import { createRouter, createRootRoute, createRoute, Outlet, redirect, Navigate } from '@tanstack/react-router'
import { AppLayout } from '@/components/Layout/AppLayout'
import { LoginPage } from '@/pages/Login'
import { DashboardPage } from '@/pages/Dashboard'
import { OrdersListPage } from '@/pages/Orders/List'
import { OrderDetailPage } from '@/pages/Orders/Detail'
import { OrderCreatePage } from '@/pages/Orders/Create'
import { AlertsListPage } from '@/pages/Alerts/List'
import { AlertDetailPage } from '@/pages/Alerts/Detail'
import { StatsPage } from '@/pages/Stats'
import { StoresPage } from '@/pages/Basic/Stores'
import { ProductsPage } from '@/pages/Basic/Products'
import { UsersPage } from '@/pages/Basic/Users'
import { useAuthStore } from '@/store/auth'

function requireAuth() {
  const token = useAuthStore.getState().token
  if (!token) {
    throw redirect({ to: '/login' })
  }
}

function guestOnly() {
  const token = useAuthStore.getState().token
  if (token) {
    throw redirect({ to: '/dashboard' })
  }
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  beforeLoad: guestOnly,
})

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_layout',
  component: AppLayout,
  beforeLoad: requireAuth,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to="/dashboard" />,
})

const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/dashboard',
  component: DashboardPage,
})

const ordersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/orders',
})

const ordersListRoute = createRoute({
  getParentRoute: () => ordersRoute,
  path: '/',
  component: OrdersListPage,
})

const ordersCreateRoute = createRoute({
  getParentRoute: () => ordersRoute,
  path: '/create',
  component: OrderCreatePage,
})

const ordersDetailRoute = createRoute({
  getParentRoute: () => ordersRoute,
  path: '/$orderId',
  component: OrderDetailPage,
})

const alertsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/alerts',
})

const alertsListRoute = createRoute({
  getParentRoute: () => alertsRoute,
  path: '/',
  component: AlertsListPage,
})

const alertsDetailRoute = createRoute({
  getParentRoute: () => alertsRoute,
  path: '/$alertId',
  component: AlertDetailPage,
})

const statsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/stats',
  component: StatsPage,
})

const basicRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/basic',
})

const storesRoute = createRoute({
  getParentRoute: () => basicRoute,
  path: '/stores',
  component: StoresPage,
})

const productsRoute = createRoute({
  getParentRoute: () => basicRoute,
  path: '/products',
  component: ProductsPage,
})

const usersRoute = createRoute({
  getParentRoute: () => basicRoute,
  path: '/users',
  component: UsersPage,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  indexRoute,
  layoutRoute.addChildren([
    dashboardRoute,
    ordersRoute.addChildren([ordersListRoute, ordersCreateRoute, ordersDetailRoute]),
    alertsRoute.addChildren([alertsListRoute, alertsDetailRoute]),
    statsRoute,
    basicRoute.addChildren([storesRoute, productsRoute, usersRoute]),
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
