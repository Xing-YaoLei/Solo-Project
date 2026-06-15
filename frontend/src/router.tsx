import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  Link as RouterLink,
  Navigate,
  RouterProvider,
} from '@tanstack/react-router'
import Layout from './components/Layout'
import StatusPool from './pages/tickets/StatusPool'
import TicketList from './pages/tickets/TicketList'
import TicketNew from './pages/tickets/TicketNew'
import TicketDetail from './pages/tickets/TicketDetail'
import PlagiarismList from './pages/plagiarism/PlagiarismList'
import PlagiarismDetail from './pages/plagiarism/PlagiarismDetail'
import PlagiarismNew from './pages/plagiarism/PlagiarismNew'
import MemberList from './pages/members/MemberList'
import BenefitList from './pages/benefits/BenefitList'
import TransactionList from './pages/transactions/TransactionList'
import Dashboard from './pages/Dashboard'

const rootRoute = createRootRoute({
  component: Layout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to="/dashboard" />,
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: Dashboard,
})

const ticketsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tickets',
})

const ticketsIndexRoute = createRoute({
  getParentRoute: () => ticketsRoute,
  path: '/',
  component: () => <TicketList />,
})

const ticketsNewRoute = createRoute({
  getParentRoute: () => ticketsRoute,
  path: 'new',
  component: () => <TicketNew />,
})

const ticketsDetailRoute = createRoute({
  getParentRoute: () => ticketsRoute,
  path: '$ticketId',
  component: () => {
    const { ticketId } = ticketsDetailRoute.useParams()
    return <TicketDetail ticketId={ticketId} />
  },
})

const ticketsSupplementRoute = createRoute({
  getParentRoute: () => ticketsRoute,
  path: 'status/supplement',
  component: () => <StatusPool poolType="supplement" />,
})

const ticketsEscalatedRoute = createRoute({
  getParentRoute: () => ticketsRoute,
  path: 'status/escalated',
  component: () => <StatusPool poolType="escalated" />,
})

const ticketsCompletedRoute = createRoute({
  getParentRoute: () => ticketsRoute,
  path: 'status/completed',
  component: () => <StatusPool poolType="completed" />,
})

const membersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/members',
  component: MemberList,
})

const benefitsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/benefits',
  component: BenefitList,
})

const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/transactions',
  component: TransactionList,
})

const plagiarismRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plagiarism',
})

const plagiarismIndexRoute = createRoute({
  getParentRoute: () => plagiarismRoute,
  path: '/',
  component: () => <PlagiarismList />,
})

const plagiarismNewRoute = createRoute({
  getParentRoute: () => plagiarismRoute,
  path: 'new',
  component: PlagiarismNew,
})

const plagiarismDetailRoute = createRoute({
  getParentRoute: () => plagiarismRoute,
  path: '$caseId',
  component: () => <PlagiarismDetail />,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  ticketsRoute.addChildren([
    ticketsIndexRoute,
    ticketsNewRoute,
    ticketsDetailRoute,
    ticketsSupplementRoute,
    ticketsEscalatedRoute,
    ticketsCompletedRoute,
  ]),
  membersRoute,
  benefitsRoute,
  transactionsRoute,
  plagiarismRoute.addChildren([
    plagiarismIndexRoute,
    plagiarismNewRoute,
    plagiarismDetailRoute,
  ]),
])

export const router = createRouter({
  routeTree,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export { RouterLink }

export default function Router() {
  return <RouterProvider router={router} />
}
