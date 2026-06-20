import { createRouter } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { Route as rootRoute } from './routes/__root'
import { Route as indexRoute } from './routes/index'
import { Route as verificationsIndexRoute } from './routes/verifications/index'
import { Route as verificationDetailRoute } from './routes/verifications/$id'
import { Route as verificationNewRoute } from './routes/verifications/new'
import { Route as summaryIndexRoute } from './routes/summary/index'

const routeTree = rootRoute.addChildren([
  indexRoute,
  verificationsIndexRoute,
  verificationDetailRoute,
  verificationNewRoute,
  summaryIndexRoute,
])

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
  })
}

export type AppRouter = ReturnType<typeof createAppRouter>
