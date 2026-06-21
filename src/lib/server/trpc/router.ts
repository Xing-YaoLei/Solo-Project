import { router } from './trpc';
import { authRouter } from './routers/auth';
import { projectsRouter } from './routers/projects';
import { changeOrdersRouter } from './routers/changeOrders';
import { acceptancePhotosRouter } from './routers/acceptancePhotos';
import { workerCheckinsRouter } from './routers/workerCheckins';
import { afterSalesOrdersRouter } from './routers/afterSalesOrders';
import { materialDelaysRouter } from './routers/materialDelays';
import { commonRouter } from './routers/common';

export const appRouter = router({
	auth: authRouter,
	projects: projectsRouter,
	changeOrders: changeOrdersRouter,
	acceptancePhotos: acceptancePhotosRouter,
	workerCheckins: workerCheckinsRouter,
	afterSalesOrders: afterSalesOrdersRouter,
	materialDelays: materialDelaysRouter,
	common: commonRouter
});

export type AppRouter = typeof appRouter;
