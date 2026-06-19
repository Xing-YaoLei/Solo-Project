import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
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
        return (_jsxs(_Fragment, { children: [_jsx(Outlet, {}), import.meta.env.DEV && _jsx(TanStackRouterDevtools, {})] }));
    },
});
