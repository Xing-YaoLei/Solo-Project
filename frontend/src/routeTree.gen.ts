import { createRouteManifest } from '@tanstack/react-router'
import { Route as rootRoute } from './routes/__root'
import { Route as LayoutImport } from './routes/_layout'
import { Route as LoginImport } from './routes/login'
import { Route as LayoutIndexImport } from './routes/_layout/index'
import { Route as LayoutQuotesImport } from './routes/_layout/quotes'
import { Route as LayoutQuotesIdImport } from './routes/_layout/quotes.$id'
import { Route as LayoutQuotesNewImport } from './routes/_layout/quotes.new'
import { Route as LayoutApprovalsImport } from './routes/_layout/approvals'
import { Route as LayoutPaymentsImport } from './routes/_layout/payments'
import { Route as LayoutExceptionsImport } from './routes/_layout/exceptions'
import { Route as LayoutStatisticsImport } from './routes/_layout/statistics'
import { Route as LayoutUsersImport } from './routes/_layout/users'
import { Route as LayoutProfileImport } from './routes/_layout/profile'

const LayoutRoute = LayoutImport.update({
  id: '/_layout',
  getParentRoute: () => rootRoute,
} as any)

const LoginRoute = LoginImport.update({
  id: '/login',
  path: '/login',
  getParentRoute: () => rootRoute,
} as any)

const LayoutIndexRoute = LayoutIndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutQuotesRoute = LayoutQuotesImport.update({
  id: '/quotes',
  path: '/quotes',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutQuotesNewRoute = LayoutQuotesNewImport.update({
  id: '/quotes/new',
  path: '/quotes/new',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutQuotesIdRoute = LayoutQuotesIdImport.update({
  id: '/quotes/$id',
  path: '/quotes/$id',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutApprovalsRoute = LayoutApprovalsImport.update({
  id: '/approvals',
  path: '/approvals',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutPaymentsRoute = LayoutPaymentsImport.update({
  id: '/payments',
  path: '/payments',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutExceptionsRoute = LayoutExceptionsImport.update({
  id: '/exceptions',
  path: '/exceptions',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutStatisticsRoute = LayoutStatisticsImport.update({
  id: '/statistics',
  path: '/statistics',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutUsersRoute = LayoutUsersImport.update({
  id: '/users',
  path: '/users',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutProfileRoute = LayoutProfileImport.update({
  id: '/profile',
  path: '/profile',
  getParentRoute: () => LayoutRoute,
} as any)

const routeTree = rootRoute.addChildren([
  LoginRoute,
  LayoutRoute.addChildren([
    LayoutIndexRoute,
    LayoutQuotesRoute,
    LayoutQuotesNewRoute,
    LayoutQuotesIdRoute,
    LayoutApprovalsRoute,
    LayoutPaymentsRoute,
    LayoutExceptionsRoute,
    LayoutStatisticsRoute,
    LayoutUsersRoute,
    LayoutProfileRoute,
  ]),
])

export const routeTree = routeTree

export const fileRoutes = createRouteManifest({
  routes: {
    './routes/__root.tsx': rootRoute,
    './routes/_layout.tsx': LayoutRoute,
    './routes/login.tsx': LoginRoute,
    './routes/_layout/index.tsx': LayoutIndexRoute,
    './routes/_layout/quotes.tsx': LayoutQuotesRoute,
    './routes/_layout/quotes.$id.tsx': LayoutQuotesIdRoute,
    './routes/_layout/quotes.new.tsx': LayoutQuotesNewRoute,
    './routes/_layout/approvals.tsx': LayoutApprovalsRoute,
    './routes/_layout/payments.tsx': LayoutPaymentsRoute,
    './routes/_layout/exceptions.tsx': LayoutExceptionsRoute,
    './routes/_layout/statistics.tsx': LayoutStatisticsRoute,
    './routes/_layout/users.tsx': LayoutUsersRoute,
    './routes/_layout/profile.tsx': LayoutProfileRoute,
  },
})

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      preLoaderRoute: typeof LayoutIndexImport
      parentRoute: typeof LayoutImport
    }
    '/login': {
      preLoaderRoute: typeof LoginImport
      parentRoute: typeof rootRoute
    }
    '/quotes': {
      preLoaderRoute: typeof LayoutQuotesImport
      parentRoute: typeof LayoutImport
    }
    '/quotes/new': {
      preLoaderRoute: typeof LayoutQuotesNewImport
      parentRoute: typeof LayoutImport
    }
    '/quotes/$id': {
      preLoaderRoute: typeof LayoutQuotesIdImport
      parentRoute: typeof LayoutImport
    }
    '/approvals': {
      preLoaderRoute: typeof LayoutApprovalsImport
      parentRoute: typeof LayoutImport
    }
    '/payments': {
      preLoaderRoute: typeof LayoutPaymentsImport
      parentRoute: typeof LayoutImport
    }
    '/exceptions': {
      preLoaderRoute: typeof LayoutExceptionsImport
      parentRoute: typeof LayoutImport
    }
    '/statistics': {
      preLoaderRoute: typeof LayoutStatisticsImport
      parentRoute: typeof LayoutImport
    }
    '/users': {
      preLoaderRoute: typeof LayoutUsersImport
      parentRoute: typeof LayoutImport
    }
    '/profile': {
      preLoaderRoute: typeof LayoutProfileImport
      parentRoute: typeof LayoutImport
    }
  }
}
