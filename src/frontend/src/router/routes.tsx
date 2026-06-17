import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { UserRole } from '@/types'
import { ProtectedRoute } from './ProtectedRoute'
import MainLayout from '@/layouts/MainLayout'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const ProjectsPage = lazy(() => import('@/pages/projects/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('@/pages/projects/ProjectDetailPage'))
const DocumentsPage = lazy(() => import('@/pages/documents/DocumentsPage'))
const DocumentDetailPage = lazy(() => import('@/pages/documents/DocumentDetailPage'))
const PaymentsPage = lazy(() => import('@/pages/payments/PaymentsPage'))
const MaterialsPage = lazy(() => import('@/pages/materials/MaterialsPage'))
const StatisticsPage = lazy(() => import('@/pages/statistics/StatisticsPage'))

const ForbiddenPage = () => (
  <div style={{ textAlign: 'center', padding: '100px' }}>
    <h1>403</h1>
    <p>您没有权限访问此页面</p>
  </div>
)

const NotFoundPage = () => (
  <div style={{ textAlign: 'center', padding: '100px' }}>
    <h1>404</h1>
    <p>页面不存在</p>
  </div>
)

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/403',
    element: <ForbiddenPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'projects',
        children: [
          {
            index: true,
            element: <ProjectsPage />,
          },
          {
            path: ':id',
            element: <ProjectDetailPage />,
          },
        ],
      },
      {
        path: 'documents',
        children: [
          {
            index: true,
            element: <DocumentsPage />,
          },
          {
            path: ':id',
            element: <DocumentDetailPage />,
          },
        ],
      },
      {
        path: 'payments',
        element: (
          <ProtectedRoute allowedRoles={[UserRole.Owner, UserRole.Supervisor]}>
            <PaymentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'materials',
        element: (
          <ProtectedRoute allowedRoles={[UserRole.Designer, UserRole.Foreman, UserRole.Supervisor]}>
            <MaterialsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'statistics',
        element: (
          <ProtectedRoute allowedRoles={[UserRole.Owner, UserRole.Supervisor]}>
            <StatisticsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]
