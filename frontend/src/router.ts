import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { getToken, getStoredUser, canAccess } from './lib/auth';
import RootLayout from './routes/__root';
import LoginPage from './routes/login';
import DashboardPage from './routes/index';
import WorkOrdersPage from './routes/work-orders';
import WorkOrderDetailPage from './routes/work-orders.$id';
import WorkOrderNewPage from './routes/work-orders.new';
import PartsPage from './routes/parts';
import QuotesPage from './routes/quotes';
import QuoteDetailPage from './routes/quotes.$id';
import InspectionsPage from './routes/inspections';
import InspectionDetailPage from './routes/inspections.$id';
import ShortagesPage from './routes/shortages';
import ShortageDetailPage from './routes/shortages.$id';
import StatisticsPage from './routes/statistics';

const rootRoute = createRootRoute({
  component: RootLayout,
  beforeLoad: () => {
    const token = getToken();
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: () => {
    const token = getToken();
    if (token) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

const workOrdersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/work-orders',
  beforeLoad: () => {
    const user = getStoredUser();
    if (user && !canAccess(user, '/work-orders')) {
      throw redirect({ to: '/' });
    }
  },
  component: WorkOrdersPage,
});

const workOrderDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/work-orders/$id',
  component: WorkOrderDetailPage,
});

const workOrderNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/work-orders/new',
  component: WorkOrderNewPage,
});

const partsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/parts',
  beforeLoad: () => {
    const user = getStoredUser();
    if (user && !canAccess(user, '/parts')) {
      throw redirect({ to: '/' });
    }
  },
  component: PartsPage,
});

const quotesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/quotes',
  beforeLoad: () => {
    const user = getStoredUser();
    if (user && !canAccess(user, '/quotes')) {
      throw redirect({ to: '/' });
    }
  },
  component: QuotesPage,
});

const quoteDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/quotes/$id',
  component: QuoteDetailPage,
});

const inspectionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/inspections',
  beforeLoad: () => {
    const user = getStoredUser();
    if (user && !canAccess(user, '/inspections')) {
      throw redirect({ to: '/' });
    }
  },
  component: InspectionsPage,
});

const inspectionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/inspections/$id',
  component: InspectionDetailPage,
});

const shortagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/shortages',
  beforeLoad: () => {
    const user = getStoredUser();
    if (user && !canAccess(user, '/shortages')) {
      throw redirect({ to: '/' });
    }
  },
  component: ShortagesPage,
});

const shortageDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/shortages/$id',
  component: ShortageDetailPage,
});

const statisticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/statistics',
  beforeLoad: () => {
    const user = getStoredUser();
    if (user && !canAccess(user, '/statistics')) {
      throw redirect({ to: '/' });
    }
  },
  component: StatisticsPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  indexRoute,
  workOrdersRoute,
  workOrderDetailRoute,
  workOrderNewRoute,
  partsRoute,
  quotesRoute,
  quoteDetailRoute,
  inspectionsRoute,
  inspectionDetailRoute,
  shortagesRoute,
  shortageDetailRoute,
  statisticsRoute,
]);

export const router = createRouter({ routeTree });

export type RouterType = typeof router;

declare module '@tanstack/react-router' {
  interface Register {
    router: RouterType;
  }
}
