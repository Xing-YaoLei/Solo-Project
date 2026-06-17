import { router } from './index';
import { authRouter } from './routers/auth';
import { inspectionRouter } from './routers/inspection';
import { contractRouter } from './routers/contract';
import { utilityRouter } from './routers/utility';
import { workOrderRouter } from './routers/work-order';
import { archiveRouter } from './routers/archive';
import { dashboardRouter } from './routers/dashboard';
import { approvalRouter } from './routers/approval';

export const appRouter = router({
	auth: authRouter,
	inspection: inspectionRouter,
	contract: contractRouter,
	utility: utilityRouter,
	workOrder: workOrderRouter,
	archive: archiveRouter,
	dashboard: dashboardRouter,
	approval: approvalRouter
});

export type AppRouter = typeof appRouter;
