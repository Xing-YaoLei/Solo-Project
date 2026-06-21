import { createRootRoute, redirect } from '@tanstack/react-router'
import { Outlet } from '@tanstack/react-router'
import { useAuthStore } from '../store/auth'

export const Route = createRootRoute({
  component: () => <Outlet />,
  beforeLoad: async ({ location }) => {
    const auth = useAuthStore.getState()
    const publicPaths = ['/login']
    const isPublic = publicPaths.some((p) => location.pathname === p || location.pathname.startsWith(p))

    if (!auth.isAuthenticated && !isPublic) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }

    if (auth.isAuthenticated && location.pathname === '/login') {
      throw redirect({ to: '/quotes' })
    }
  },
})
