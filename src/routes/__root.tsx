import { createRootRoute, Outlet, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isLoginRoute = pathname === '/login' || pathname.startsWith('/login');

  useEffect(() => {
    if (isLoginRoute) {
      if (isAuthenticated) {
        router.navigate({ to: '/dashboard', replace: true });
      }
      return;
    }
    if (!isAuthenticated) {
      router.navigate({ to: '/login', replace: true });
      return;
    }
    if (pathname === '/') {
      router.navigate({ to: '/dashboard', replace: true });
    }
  }, [isAuthenticated, isLoginRoute, pathname, router]);

  if (isLoginRoute) {
    if (isAuthenticated) {
      return null;
    }
    return <Outlet />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (pathname === '/') {
    return null;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
