import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/pages/Login';
import { ReviewWorkbench } from '@/pages/ReviewWorkbench';
import { PrescriptionDetail } from '@/pages/PrescriptionDetail';
import { ExceptionList } from '@/pages/ExceptionList';
import { ExceptionDetail } from '@/pages/ExceptionDetail';
import DataExport from '@/pages/DataExport';
import Dashboard from '@/pages/Dashboard';

const rootRoute = createRootRoute({
  component: () => <Layout><Outlet /></Layout>,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: ReviewWorkbench,
});

const prescriptionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/prescription/$id',
  component: PrescriptionDetail,
});

const exceptionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/exceptions',
  component: ExceptionList,
});

const exceptionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/exceptions/$id',
  component: ExceptionDetail,
});

const exportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/export',
  component: DataExport,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: Dashboard,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  indexRoute,
  prescriptionDetailRoute,
  exceptionsRoute,
  exceptionDetailRoute,
  exportRoute,
  dashboardRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
