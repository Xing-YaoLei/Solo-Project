import { router } from '../trpc';
import { authRouter } from './auth';
import { projectRouter } from './project';
import { authorizationRouter } from './authorization';
import { changeRouter } from './change';
import { profileRouter } from './profile';
import { reviewRouter } from './review';
import { attachmentRouter } from './attachment';

export const appRouter = router({
	auth: authRouter,
	project: projectRouter,
	authorization: authorizationRouter,
	change: changeRouter,
	profile: profileRouter,
	review: reviewRouter,
	attachment: attachmentRouter
});

export type AppRouter = typeof appRouter;
