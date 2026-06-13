import { createRouter, createRootRoute, createRoute, createBrowserRouter, Outlet, Navigate } from '@tanstack/react-router';
import App from './App';
import LoginPage from './pages/Login';
import Layout from './components/Layout';
import DashboardPage from './pages/Dashboard';
import CoursesPage from './pages/Courses';
import CourseDetailPage from './pages/CourseDetail';
import RecordsPage from './pages/Records';
import ReviewPage from './pages/Review';
import NotificationsPage from './pages/Notifications';

const rootRoute = createRootRoute({
  component: App,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  component: () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return <Navigate to="/login" />;
    }
    return <Layout><Outlet /></Layout>;
  },
});

const indexRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/',
  component: () => <Navigate to="/dashboard" />,
});

const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const coursesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/courses',
  component: CoursesPage,
});

const courseDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/courses/$courseId',
  component: CourseDetailPage,
});

const recordsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/records',
  component: RecordsPage,
});

const reviewRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/review',
  component: ReviewPage,
});

const notificationsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/notifications',
  component: NotificationsPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedRoute.addChildren([
    indexRoute,
    dashboardRoute,
    coursesRoute,
    courseDetailRoute,
    recordsRoute,
    reviewRoute,
    notificationsRoute,
  ]),
]);

export const router = createBrowserRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
