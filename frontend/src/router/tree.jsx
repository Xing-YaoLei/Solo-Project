import { Route as rootRoute } from './__root'
import { Route as IndexRoute } from '../routes/index'
import { Route as PackagesRoute } from '../routes/packages'
import { Route as StayDatesRoute } from '../routes/stay-dates'
import { Route as InventoriesRoute } from '../routes/inventories'
import { Route as OrdersRoute } from '../routes/orders'
import { Route as VerificationsRoute } from '../routes/verifications'
import { Route as DepositsRoute } from '../routes/deposits'
import { Route as AnomaliesRoute } from '../routes/anomalies'
import { Route as AnalyticsRoute } from '../routes/analytics'
import { Route as ExportsRoute } from '../routes/exports'

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  PackagesRoute,
  StayDatesRoute,
  InventoriesRoute,
  OrdersRoute,
  VerificationsRoute,
  DepositsRoute,
  AnomaliesRoute,
  AnalyticsRoute,
  ExportsRoute,
])
