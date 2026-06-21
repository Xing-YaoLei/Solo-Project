import { Outlet } from '@tanstack/react-router'
import { createRootRouteWithContext, createRoute, createRouter } from '@tanstack/react-router'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import SubsidyRules from '@/pages/SubsidyRules'
import SubsidyRuleDetail from '@/pages/SubsidyRuleDetail'
import Appeals from '@/pages/Appeals'
import AppealDetail from '@/pages/AppealDetail'
import Settlements from '@/pages/Settlements'
import SettlementDetail from '@/pages/SettlementDetail'
import Compensations from '@/pages/Compensations'
import Photos from '@/pages/Photos'
import TodoPool from '@/pages/TodoPool'
import TodoTicketDetail from '@/pages/TodoTicketDetail'
import ReportDispatch from '@/pages/ReportDispatch'
import ReportSubsidy from '@/pages/ReportSubsidy'
import ReportPerformance from '@/pages/ReportPerformance'
import RiderSubsidies from '@/pages/RiderSubsidies'
import RiderAppeals from '@/pages/RiderAppeals'
import type { AuthState } from '@/stores/auth'

interface RouterContext {
  auth: AuthState
}

const Passthrough = () => <Outlet />

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Layout,
})

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Home })

const subsidyRulesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/subsidy-rules', component: Passthrough })
const subsidyRulesIndexRoute = createRoute({ getParentRoute: () => subsidyRulesRoute, path: '/', component: SubsidyRules })
const subsidyRuleDetailRoute = createRoute({ getParentRoute: () => subsidyRulesRoute, path: '/$ruleId', component: SubsidyRuleDetail })

const appealsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/appeals', component: Passthrough })
const appealsIndexRoute = createRoute({ getParentRoute: () => appealsRoute, path: '/', component: Appeals })
const appealDetailRoute = createRoute({ getParentRoute: () => appealsRoute, path: '/$appealId', component: AppealDetail })

const settlementsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settlements', component: Passthrough })
const settlementsIndexRoute = createRoute({ getParentRoute: () => settlementsRoute, path: '/', component: Settlements })
const settlementDetailRoute = createRoute({ getParentRoute: () => settlementsRoute, path: '/$batchId', component: SettlementDetail })

const compensationsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/compensations', component: Compensations })
const photosRoute = createRoute({ getParentRoute: () => rootRoute, path: '/photos', component: Photos })

const todoPoolRoute = createRoute({ getParentRoute: () => rootRoute, path: '/todo-pool', component: Passthrough })
const todoPoolIndexRoute = createRoute({ getParentRoute: () => todoPoolRoute, path: '/', component: TodoPool })
const todoTicketDetailRoute = createRoute({ getParentRoute: () => todoPoolRoute, path: '/$ticketId', component: TodoTicketDetail })

const reportsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/reports', component: Passthrough })
const reportDispatchRoute = createRoute({ getParentRoute: () => reportsRoute, path: '/dispatch-duration', component: ReportDispatch })
const reportSubsidyRoute = createRoute({ getParentRoute: () => reportsRoute, path: '/subsidy-summary', component: ReportSubsidy })
const reportPerformanceRoute = createRoute({ getParentRoute: () => reportsRoute, path: '/performance', component: ReportPerformance })

const riderRoute = createRoute({ getParentRoute: () => rootRoute, path: '/rider', component: Passthrough })
const riderSubsidiesRoute = createRoute({ getParentRoute: () => riderRoute, path: '/subsidies', component: RiderSubsidies })
const riderAppealsRoute = createRoute({ getParentRoute: () => riderRoute, path: '/appeals', component: RiderAppeals })

const routeTree = rootRoute.addChildren([
  homeRoute,
  subsidyRulesRoute.addChildren([subsidyRulesIndexRoute, subsidyRuleDetailRoute]),
  appealsRoute.addChildren([appealsIndexRoute, appealDetailRoute]),
  settlementsRoute.addChildren([settlementsIndexRoute, settlementDetailRoute]),
  compensationsRoute,
  photosRoute,
  todoPoolRoute.addChildren([todoPoolIndexRoute, todoTicketDetailRoute]),
  reportsRoute.addChildren([reportDispatchRoute, reportSubsidyRoute, reportPerformanceRoute]),
  riderRoute.addChildren([riderSubsidiesRoute, riderAppealsRoute]),
])

export const router = createRouter({
  routeTree,
  context: { auth: undefined as unknown as AuthState },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
