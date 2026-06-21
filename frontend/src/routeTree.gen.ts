import { Suspense } from 'react'
import { createRootRoute, createRoute, redirect, Outlet, ScrollRestoration } from '@tanstack/react-router'
import AppLayout from '../components/layout/AppLayout'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Documents from '../pages/Documents'
import DocumentDetail from '../pages/DocumentDetail'
import Audit from '../pages/Audit'
import Stats from '../pages/Stats'

function LoadFallback() {
  return <div className="empty-state">加载中...</div>
}

export const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  ),
})

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'login',
  component: Login,
})

export const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: AppLayout,
  beforeLoad: () => {
    const token = localStorage.getItem('token')
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
})

export const indexRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})

export const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: 'dashboard',
  component: () => (
    <Suspense fallback={<LoadFallback />}>
      <Dashboard />
    </Suspense>
  ),
})

export const documentsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: 'documents',
  component: () => (
    <Suspense fallback={<LoadFallback />}>
      <Documents />
    </Suspense>
  ),
})

export const documentDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: 'documents/$id',
  component: () => (
    <Suspense fallback={<LoadFallback />}>
      <DocumentDetail />
    </Suspense>
  ),
})

export const auditRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: 'audit',
  component: () => (
    <Suspense fallback={<LoadFallback />}>
      <Audit />
    </Suspense>
  ),
})

export const statsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: 'stats',
  component: () => (
    <Suspense fallback={<LoadFallback />}>
      <Stats />
    </Suspense>
  ),
})

export const routeTree = rootRoute.addChildren([
  loginRoute,
  authenticatedRoute.addChildren([
    indexRoute,
    dashboardRoute,
    documentsRoute,
    documentDetailRoute,
    auditRoute,
    statsRoute,
  ]),
])
