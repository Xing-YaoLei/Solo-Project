import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import OrderList from './pages/orders/OrderList'
import OrderDetail from './pages/orders/OrderDetail'
import AddressDict from './pages/admin/AddressDict'
import TrackRules from './pages/admin/TrackRules'
import SubsidyRules from './pages/admin/SubsidyRules'
import AppealList from './pages/appeals/AppealList'
import AppealDetail from './pages/appeals/AppealDetail'
import SettlementList from './pages/settlements/SettlementList'
import Stats from './pages/stats/Stats'
import Riders from './pages/riders/Riders'

const rootRoute = createRootRoute({
  component: Layout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
})

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders',
  component: OrderList,
})

const orderDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders/$orderId',
  component: OrderDetail,
})

const appealsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/appeals',
  component: AppealList,
})

const appealDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/appeals/$appealId',
  component: AppealDetail,
})

const settlementsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settlements',
  component: SettlementList,
})

const statsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stats',
  component: Stats,
})

const addressDictRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/address-dict',
  component: AddressDict,
})

const trackRulesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/track-rules',
  component: TrackRules,
})

const subsidyRulesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/subsidy-rules',
  component: SubsidyRules,
})

const ridersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/riders',
  component: Riders,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  ordersRoute,
  orderDetailRoute,
  appealsRoute,
  appealDetailRoute,
  settlementsRoute,
  statsRoute,
  addressDictRoute,
  trackRulesRoute,
  subsidyRulesRoute,
  ridersRoute,
])

const router = createRouter({ routeTree })

export default router
