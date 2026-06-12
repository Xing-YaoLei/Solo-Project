import { createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router'
import AppLayout from './components/Layout'
import Dashboard from './pages/Dashboard'
import GroupBatchList from './pages/group-batch/List'
import GroupBatchDetail from './pages/group-batch/Detail'
import ArrivalList from './pages/arrival-list/List'
import PickupCodeList from './pages/pickup-code/List'
import AfterSaleList from './pages/after-sale/List'
import ExceptionOrderList from './pages/exception-order/List'
import ExceptionOrderDetail from './pages/exception-order/Detail'
import ReportPage from './pages/Report'
import ProductList from './pages/product/List'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: AppLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: Dashboard,
})

const groupBatchRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/group-batches',
  component: GroupBatchList,
})

const groupBatchDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/group-batches/$id',
  component: GroupBatchDetail,
})

const arrivalListRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/arrival-lists',
  component: ArrivalList,
})

const pickupCodeRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/pickup-codes',
  component: PickupCodeList,
})

const afterSaleRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/after-sales',
  component: AfterSaleList,
})

const exceptionOrderRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/exception-orders',
  component: ExceptionOrderList,
})

const exceptionOrderDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/exception-orders/$id',
  component: ExceptionOrderDetail,
})

const reportRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/reports',
  component: ReportPage,
})

const productRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/products',
  component: ProductList,
})

const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([
    indexRoute,
    groupBatchRoute,
    groupBatchDetailRoute,
    arrivalListRoute,
    pickupCodeRoute,
    afterSaleRoute,
    exceptionOrderRoute,
    exceptionOrderDetailRoute,
    reportRoute,
    productRoute,
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
