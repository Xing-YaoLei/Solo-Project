import { createRouter, createRootRoute, createRoute, redirect } from '@tanstack/react-router'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ElderList from './pages/elders/ElderList'
import ElderDetail from './pages/elders/ElderDetail'
import MedicationList from './pages/medications/MedicationList'
import VisitList from './pages/visits/VisitList'
import ActivityList from './pages/activities/ActivityList'
import ActivityDetail from './pages/activities/ActivityDetail'
import RiskList from './pages/risks/RiskList'
import IncidentList from './pages/incidents/IncidentList'
import IncidentDetail from './pages/incidents/IncidentDetail'
import ExportPage from './pages/exports/ExportPage'
import AuditLogPage from './pages/audit/AuditLogPage'
import { useAuthStore } from './stores/auth'

const rootRoute = createRootRoute()

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
})

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: Layout,
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
})

const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'dashboard',
  component: Dashboard,
})

const eldersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'elders',
  component: ElderList,
})

const elderDetailRoute = createRoute({
  getParentRoute: () => eldersRoute,
  path: '$id',
  component: ElderDetail,
})

const medicationsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'medications',
  component: MedicationList,
})

const visitsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'visits',
  component: VisitList,
})

const activitiesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'activities',
  component: ActivityList,
})

const activityDetailRoute = createRoute({
  getParentRoute: () => activitiesRoute,
  path: '$id',
  component: ActivityDetail,
})

const risksRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'risks',
  component: RiskList,
})

const incidentsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'incidents',
  component: IncidentList,
})

const incidentDetailRoute = createRoute({
  getParentRoute: () => incidentsRoute,
  path: '$id',
  component: IncidentDetail,
})

const exportsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'exports',
  component: ExportPage,
})

const auditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'audit',
  component: AuditLogPage,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated
    if (isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    } else {
      throw redirect({ to: '/login' })
    }
  },
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  layoutRoute.addChildren([
    dashboardRoute,
    eldersRoute,
    elderDetailRoute,
    medicationsRoute,
    visitsRoute,
    activitiesRoute,
    activityDetailRoute,
    risksRoute,
    incidentsRoute,
    incidentDetailRoute,
    exportsRoute,
    auditRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
