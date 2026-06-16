import { createTRPCRouter } from '../trpc';
import { authRouter } from './auth';
import { elderRouter } from './elder';
import { assessmentRouter } from './assessment';
import { careLevelRouter } from './careLevel';
import { medicationRouter } from './medication';
import { visitRouter } from './visit';
import { incidentRouter } from './incident';
import { flowRouter } from './flow';
import { analyticsRouter } from './analytics';
import { userRouter } from './user';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  elder: elderRouter,
  assessment: assessmentRouter,
  careLevel: careLevelRouter,
  medication: medicationRouter,
  visit: visitRouter,
  incident: incidentRouter,
  flow: flowRouter,
  analytics: analyticsRouter,
  user: userRouter
});

export type AppRouter = typeof appRouter;
