import { createRootRoute, Outlet, Navigate } from '@tanstack/react-router';
import { Layout } from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (window.location.pathname === '/' || window.location.pathname === '/login') {
    return <Navigate to="/dashboard" replace />;
  }

  if (window.location.pathname.startsWith('/login')) {
    return <Outlet />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
