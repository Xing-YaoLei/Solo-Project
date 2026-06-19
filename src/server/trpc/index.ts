import { router } from './t';
import { authRouter } from './routers/auth';
import { propertyRouter } from './routers/property';
import { orderRouter } from './routers/order';
import { cleaningRouter } from './routers/cleaning';
import { guestRouter } from './routers/guest';
import { depositRouter } from './routers/deposit';
import { exceptionRouter } from './routers/exception';
import { auditRouter } from './routers/audit';
import { reportsRouter } from './routers/reports';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

export const appRouter = router({
	auth: authRouter,
	property: propertyRouter,
	order: orderRouter,
	cleaning: cleaningRouter,
	guest: guestRouter,
	deposit: depositRouter,
	exception: exceptionRouter,
	audit: auditRouter,
	reports: reportsRouter
});

export type AppRouter = typeof appRouter;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

import { createCallerFactory } from './t';
export const createCaller = createCallerFactory(appRouter);
