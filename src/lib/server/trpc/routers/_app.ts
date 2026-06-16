import { createTRPCRouter } from '../trpc';
import { authRouter } from './auth';
import { patientRouter } from './patient';
import { medicalRecordRouter } from './medicalRecord';
import { treatmentPlanRouter } from './treatmentPlan';
import { followupTaskRouter } from './followupTask';
import { imagingAttachmentRouter } from './imagingAttachment';
import { exceptionOrderRouter } from './exceptionOrder';
import { statisticsRouter } from './statistics';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  patient: patientRouter,
  medicalRecord: medicalRecordRouter,
  treatmentPlan: treatmentPlanRouter,
  followupTask: followupTaskRouter,
  imagingAttachment: imagingAttachmentRouter,
  exceptionOrder: exceptionOrderRouter,
  statistics: statisticsRouter
});

export type AppRouter = typeof appRouter;
