import {
  createRouter,
  createRootRoute,
  createRoute,
  createLazyRoute,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { Spin } from 'antd'
import { useAuthStore } from './store/auth'
import LayoutComponent from './components/Layout'

const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
    <Spin size="large" />
  </div>
)

const LoginPage = lazy(() => import('./pages/Login'))
const QuotesPage = lazy(() => import('./pages/Quotes'))
const QuoteDetailPage = lazy(() => import('./pages/QuoteDetail'))
const QuoteNewPage = lazy(() => import('./pages/QuoteNew'))
const ApprovalsPage = lazy(() => import('./pages/Approvals'))
const PaymentsPage = lazy(() => import('./pages/Payments'))
const ExceptionsPage = lazy(() => import('./pages/Exceptions'))
const StatisticsPage = lazy(() => import('./pages/Statistics'))
const UsersPage = lazy(() => import('./pages/Users'))
const ProfilePage = lazy(() => import('./pages/Profile'))

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  beforeLoad: async ({ location }) => {
    const auth = useAuthStore.getState()
    const publicPaths = ['/login']
    const isPublic = publicPaths.some(
      (p) => location.pathname === p || location.pathname.startsWith(p)
    )

    if (!auth.isAuthenticated && !isPublic) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }

    if (auth.isAuthenticated && location.pathname === '/login') {
      throw redirect({ to: '/quotes' })
    }
  },
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <LoginPage />
    </Suspense>
  ),
})

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_layout',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <LayoutComponent>
        <Outlet />
      </LayoutComponent>
    </Suspense>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/quotes' })
  },
  component: () => null,
})

const quotesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/quotes',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <QuotesPage />
    </Suspense>
  ),
})

const quoteNewRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/quotes/new',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <QuoteNewPage />
    </Suspense>
  ),
})

const quoteDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/quotes/$id',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <QuoteDetailPage />
    </Suspense>
  ),
})

const approvalsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/approvals',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <ApprovalsPage />
    </Suspense>
  ),
})

const paymentsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/payments',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentsPage />
    </Suspense>
  ),
})

const exceptionsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/exceptions',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <ExceptionsPage />
    </Suspense>
  ),
})

const statisticsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/statistics',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <StatisticsPage />
    </Suspense>
  ),
})

const usersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/users',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <UsersPage />
    </Suspense>
  ),
})

const profileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/profile',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <ProfilePage />
    </Suspense>
  ),
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  layoutRoute.addChildren([
    indexRoute,
    quotesRoute,
    quoteNewRoute,
    quoteDetailRoute,
    approvalsRoute,
    paymentsRoute,
    exceptionsRoute,
    statisticsRoute,
    usersRoute,
    profileRoute,
  ]),
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: {
    auth: undefined!,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
