import { createTRPCRouter } from './context';
import { authRouter } from './routes/auth';
import { followupRouter } from './routes/followup';
import { memberRouter } from './routes/member';
import { drugRouter } from './routes/drug';
import { replenishmentRouter } from './routes/replenishment';
import { prescriptionRouter, insuranceRouter } from './routes/prescription';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  followup: followupRouter,
  member: memberRouter,
  drug: drugRouter,
  replenishment: replenishmentRouter,
  prescription: prescriptionRouter,
  insurance: insuranceRouter
});

export type AppRouter = typeof appRouter;
