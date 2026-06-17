import { createRootRoute, Outlet, createFileRoute } from '@tanstack/react-router';
import { Navigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/Layout/AppLayout';
import { useAuthStore } from '@/store/auth';

const RootComponent = () => {
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
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const location = window.location;
    if (!location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  return isAuthenticated ? <AppLayout><Outlet /></Outlet> : <Outlet />;
};

export const Route = createRootRoute({
  component: RootComponent,
});
