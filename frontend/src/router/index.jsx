import { createRouter, createRootRoute, createRoute, Outlet, Navigate, redirect } from '@tanstack/react-router'
import AppLayout from '../components/AppLayout'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import RecordView from '../pages/RecordView'
import Reviews from '../pages/Reviews'
import Advisors from '../pages/Advisors'
import MonthlyReview from '../pages/MonthlyReview'
import Reports from '../pages/Reports'
import Notifications from '../pages/Notifications'
import AuditLogs from '../pages/AuditLogs'
import Students from '../pages/Students'
import { useAuthStore } from '../store/auth'

const rootRoute = createRootRoute({})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
})

const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />
    }
    return <AppLayout><Outlet /></AppLayout>
  },
})

const indexRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/',
  component: () => <Navigate to="/dashboard" replace />,
})

const dashboardRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: 'dashboard',
  component: Dashboard,
})

const recordViewRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: 'records',
  component: RecordView,
})

const reviewsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: 'reviews',
  component: Reviews,
})

const studentsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: 'students',
  component: Students,
})

const advisorsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: 'advisors',
  component: Advisors,
})

const monthlyRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: 'monthly-review',
  component: MonthlyReview,
})

const reportsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: 'reports',
  component: Reports,
})

const notificationsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: 'notifications',
  component: Notifications,
})

const auditRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: 'audit',
  component: AuditLogs,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  authLayoutRoute.addChildren([
    indexRoute,
    dashboardRoute,
    recordViewRoute,
    reviewsRoute,
    studentsRoute,
    advisorsRoute,
    monthlyRoute,
    reportsRoute,
    notificationsRoute,
    auditRoute,
  ]),
])

export const router = createRouter({ routeTree })
