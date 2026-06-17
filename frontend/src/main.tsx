import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  createLazyFileRoute,
  Outlet,
  Navigate,
} from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import './index.css';

import AppLayout from '@/components/Layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import CalendarPage from '@/pages/CalendarPage';
import ScheduleListPage from '@/pages/ScheduleListPage';
import ScheduleDetailPage from '@/pages/ScheduleDetailPage';
import ScheduleCreatePage from '@/pages/ScheduleCreatePage';
import TodoPage from '@/pages/TodoPage';
import ConflictPage from '@/pages/ConflictPage';
import UsersPage from '@/pages/UsersPage';
import ApartmentsPage from '@/pages/ApartmentsPage';
import ReportsPage from '@/pages/ReportsPage';
import { useAuthStore } from '@/store/auth';

function RootComponent() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser);
  const [inited, setInited] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !useAuthStore.getState().currentUser) {
      fetchCurrentUser().finally(() => setInited(true));
    } else {
      setInited(true);
    }
  }, []);

  if (!inited || isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Outlet />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: () => {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    if (isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    return <LoginPage />;
  },
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calendar',
  component: CalendarPage,
});

const schedulesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/schedules',
  component: ScheduleListPage,
});

const schedulesCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/schedules/create',
  component: ScheduleCreatePage,
});

const scheduleDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/schedules/$scheduleId',
  component: ScheduleDetailPage,
});

const todosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/todos',
  component: TodoPage,
});

const conflictsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/conflicts',
  component: ConflictPage,
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: UsersPage,
});

const apartmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/apartments',
  component: ApartmentsPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: ReportsPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  indexRoute,
  dashboardRoute,
  calendarRoute,
  schedulesRoute,
  schedulesCreateRoute,
  scheduleDetailRoute,
  todosRoute,
  conflictsRoute,
  usersRoute,
  apartmentsRoute,
  reportsRoute,
]);

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}
