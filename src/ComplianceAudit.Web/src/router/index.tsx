import { lazy, Suspense } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';
import { Spin } from 'antd';
import MainLayout from '@/layouts/MainLayout';
import { useAuthStore } from '@/store/authStore';

const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Schedules = lazy(() => import('@/pages/Schedules'));
const ScheduleDetail = lazy(() => import('@/pages/ScheduleDetail'));
const Statistics = lazy(() => import('@/pages/Statistics'));
const EvidenceMissing = lazy(() => import('@/pages/EvidenceMissing'));
const Rectifications = lazy(() => import('@/pages/Rectifications'));
const DocumentTrace = lazy(() => import('@/pages/DocumentTrace'));

const Loading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />
  </div>
);

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

export default function AppRoutes() {
  return useRoutes([
    {
      path: '/login',
      element: (
        <Suspense fallback={<Loading />}>
          <Login />
        </Suspense>
      )
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        {
          path: 'dashboard',
          element: (
            <Suspense fallback={<Loading />}>
              <Dashboard />
            </Suspense>
          )
        },
        {
          path: 'schedules',
          element: (
            <Suspense fallback={<Loading />}>
              <Schedules />
            </Suspense>
          )
        },
        {
          path: 'schedules/:id',
          element: (
            <Suspense fallback={<Loading />}>
              <ScheduleDetail />
            </Suspense>
          )
        },
        {
          path: 'rectifications',
          element: (
            <Suspense fallback={<Loading />}>
              <Rectifications />
            </Suspense>
          )
        },
        {
          path: 'evidence-missing',
          element: (
            <Suspense fallback={<Loading />}>
              <EvidenceMissing />
            </Suspense>
          )
        },
        {
          path: 'statistics',
          element: (
            <Suspense fallback={<Loading />}>
              <Statistics />
            </Suspense>
          )
        },
        {
          path: 'document-trace',
          element: (
            <Suspense fallback={<Loading />}>
              <DocumentTrace />
            </Suspense>
          )
        }
      ]
    },
    { path: '*', element: <Navigate to="/" replace /> }
  ]);
}
