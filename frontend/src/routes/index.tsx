import { createRoute, createRouter, createRootRoute, Outlet } from '@tanstack/react-router'
import { Layout } from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Reservations from '@/pages/Reservations'
import ReservationDetail from '@/pages/ReservationDetail'
import TimeSlots from '@/pages/TimeSlots'
import Conflicts from '@/pages/Conflicts'
import ConflictDetail from '@/pages/ConflictDetail'
import Statistics from '@/pages/Statistics'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Layout,
})

const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: Dashboard,
})

const reservationsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'reservations',
  component: Reservations,
})

const reservationDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'reservations/$id',
  component: ReservationDetail,
})

const timeSlotsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'time-slots',
  component: TimeSlots,
})

const conflictsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'conflicts',
  component: Conflicts,
})

const conflictDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'conflicts/$id',
  component: ConflictDetail,
})

const statisticsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'statistics',
  component: Statistics,
})

const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([
    dashboardRoute,
    reservationsRoute,
    reservationDetailRoute,
    timeSlotsRoute,
    conflictsRoute,
    conflictDetailRoute,
    statisticsRoute,
  ]),
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
