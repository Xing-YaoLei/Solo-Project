import { router } from '../trpc';
import { authRouter } from './auth';
import { elderlyRouter } from './elderly';
import { medicationRouter } from './medication';
import { activityRouter } from './activity';
import { riskRouter } from './risk';
import { userRouter } from './user';
import { dashboardRouter } from './dashboard';

export const appRouter = router({
	auth: authRouter,
	elderly: elderlyRouter,
	medication: medicationRouter,
	activity: activityRouter,
	risk: riskRouter,
	user: userRouter,
	dashboard: dashboardRouter
});

export type AppRouter = typeof appRouter;
