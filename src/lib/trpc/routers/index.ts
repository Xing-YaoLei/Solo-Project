import { createTRPCRouter, mergeRouters } from '../server';
import { authRouter } from './auth';
import { workOrderRouter } from './workOrder';
import { partRouter } from './part';
import { quoteRouter } from './quote';
import { exceptionRouter } from './exception';
import { attachmentRouter } from './attachment';
import { statsRouter } from './stats';

export const appRouter = createTRPCRouter({
	auth: authRouter,
	workOrder: workOrderRouter,
	part: partRouter,
	quote: quoteRouter,
	exception: exceptionRouter,
	attachment: attachmentRouter,
	stats: statsRouter
});

export type AppRouter = typeof appRouter;

export { mergeRouters };
