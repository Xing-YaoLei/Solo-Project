import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { useEffect } from 'react';
import { useAuth } from '../store/auth';

export const Route = createRootRoute({
  component: () => {
    const { isAuthenticated, fetchMe, token } = useAuth();

    useEffect(() => {
      if (token && isAuthenticated && !useAuth.getState().user) {
        fetchMe();
      }
    }, [token, isAuthenticated, fetchMe]);

    return (
      <>
        <Outlet />
        {import.meta.env.DEV && <TanStackRouterDevtools />}
      </>
    );
  },
});
