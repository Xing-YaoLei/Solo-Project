import { createRouter, createRootRoute, createRoute, Outlet, redirect } from '@tanstack/react-router';
import App from './App';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import LossReportList from '@/pages/LossReportList';
import LossReportDetail from '@/pages/LossReportDetail';
import LossReportCreate from '@/pages/LossReportCreate';
import ReviewPage from '@/pages/ReviewPage';
import ApprovalPage from '@/pages/ApprovalPage';
import Statistics from '@/pages/Statistics';
import StoreManagement from '@/pages/StoreManagement';
import { useAuthStore } from '@/store/auth';

const rootRoute = createRootRoute({
  component: App,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
    throw redirect({ to: '/dashboard' });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: Dashboard,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});

const lossReportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/loss-reports',
  component: LossReportList,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});

const lossReportDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/loss-reports/$id',
  component: LossReportDetail,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});

const lossReportCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/loss-reports/create',
  component: LossReportCreate,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});

const reviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reviews',
  component: ReviewPage,
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});

const approvalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/approvals',
  component: ApprovalPage,
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
    if (user?.role !== 'manager') {
      throw redirect({ to: '/dashboard' });
    }
  },
});

const statisticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/statistics',
  component: Statistics,
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
    if (user?.role !== 'manager') {
      throw redirect({ to: '/dashboard' });
    }
  },
});

const storesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stores',
  component: StoreManagement,
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
    if (user?.role !== 'manager') {
      throw redirect({ to: '/dashboard' });
    }
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardRoute,
  lossReportsRoute,
  lossReportDetailRoute,
  lossReportCreateRoute,
  reviewRoute,
  approvalRoute,
  statisticsRoute,
  storesRoute,
]);

export const router = createRouter({
  routeTree,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
