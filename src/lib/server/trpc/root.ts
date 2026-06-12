import { createTRPCRouter } from './trpc';
import { authRouter } from './routers/auth';
import { dictionaryRouter } from './routers/dictionary';
import { refundRouter } from './routers/refund';
import { statsRouter } from './routers/stats';

export const appRouter = createTRPCRouter({
	auth: authRouter,
	dictionary: dictionaryRouter,
	refund: refundRouter,
	stats: statsRouter
});

export type AppRouter = typeof appRouter;
