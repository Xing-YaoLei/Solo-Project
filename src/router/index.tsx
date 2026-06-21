import React, { lazy, Suspense, type ReactNode } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Loading } from '@/components/ui/Loading';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const CaseDetail = lazy(() => import('@/pages/CaseDetail'));
const ShareManage = lazy(() => import('@/pages/ShareManage'));
const ExportCenter = lazy(() => import('@/pages/ExportCenter'));
const ShareAccess = lazy(() => import('@/pages/ShareAccess'));

interface RouteConfig {
  path: string;
  element: ReactNode;
  requireAuth?: boolean;
  roles?: UserRole[];
}

const RequireAuth: React.FC<{ children: ReactNode; roles?: UserRole[] }> = ({
  children,
  roles,
}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const hasRole = useAuthStore((state) => state.hasRole);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !hasRole(roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const GuestOnly: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <Layout>
      <Suspense fallback={<Loading fullScreen />}>{children}</Suspense>
    </Layout>
  );
};

const publicRoutes: RouteConfig[] = [
  {
    path: '/login',
    element: (
      <GuestOnly>
        <Suspense fallback={<Loading fullScreen />}>
          <Login />
        </Suspense>
      </GuestOnly>
    ),
    requireAuth: false,
  },
  {
    path: '/share/:token',
    element: (
      <Suspense fallback={<Loading fullScreen />}>
        <ShareAccess />
      </Suspense>
    ),
    requireAuth: false,
  },
];

const protectedRoutes: RouteConfig[] = [
  {
    path: '/dashboard',
    element: <Dashboard />,
    requireAuth: true,
  },
  {
    path: '/cases/:id',
    element: <CaseDetail />,
    requireAuth: true,
  },
  {
    path: '/share-manage',
    element: <ShareManage />,
    requireAuth: true,
    roles: ['partner', 'lawyer'],
  },
  {
    path: '/export-center',
    element: <ExportCenter />,
    requireAuth: true,
    roles: ['partner', 'lawyer', 'assistant'],
  },
];

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {publicRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={route.element}
          />
        ))}

        {protectedRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <RequireAuth roles={route.roles}>
                <AppLayout>{route.element}</AppLayout>
              </RequireAuth>
            }
          />
        ))}

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
