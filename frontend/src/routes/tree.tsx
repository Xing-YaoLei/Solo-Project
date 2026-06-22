import { createRootRoute, createRoute, createRouter, Outlet, Navigate } from '@tanstack/react-router';
import { Layout } from 'antd';
import Login from '@/pages/Login';
import AppLayout from '@/components/Layout';
import DesktopOrders from '@/pages/desktop/Orders';
import DesktopOrderDetail from '@/pages/desktop/OrderDetail';
import DesktopAnalytics from '@/pages/desktop/Analytics';
import DesktopDispatchRules from '@/pages/desktop/DispatchRules';
import DesktopReview from '@/pages/desktop/Review';
import MobileOrders from '@/pages/mobile/Orders';
import MobileOrderDetail from '@/pages/mobile/OrderDetail';
import MobileProcess from '@/pages/mobile/Process';
import { useAuthStore } from '@/hooks/useStore';

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
});

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_protected',
  component: () => {
    const token = useAuthStore((state) => state.token);
    if (!token) {
      return <Navigate to="/login" />;
    }
    return <AppLayout><Outlet /></AppLayout>;
  },
});

const indexRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/',
  component: () => <Navigate to="/orders" />,
});

const desktopOrdersRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/orders',
  component: DesktopOrders,
});

const desktopOrderDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/orders/$orderId',
  component: DesktopOrderDetail,
});

const desktopAnalyticsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/analytics',
  component: DesktopAnalytics,
});

const desktopDispatchRulesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/dispatch-rules',
  component: DesktopDispatchRules,
});

const desktopReviewRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/review',
  component: DesktopReview,
});

const mobileOrdersRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/m/orders',
  component: MobileOrders,
});

const mobileOrderDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/m/orders/$orderId',
  component: MobileOrderDetail,
});

const mobileProcessRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/m/process/$orderId',
  component: MobileProcess,
});

export const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedRoute.addChildren([
    indexRoute,
    desktopOrdersRoute,
    desktopOrderDetailRoute,
    desktopAnalyticsRoute,
    desktopDispatchRulesRoute,
    desktopReviewRoute,
    mobileOrdersRoute,
    mobileOrderDetailRoute,
    mobileProcessRoute,
  ]),
]);

export const router = createRouter({ routeTree });
