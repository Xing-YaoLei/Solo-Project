import { router } from './context';
import { authRouter } from './procedures/auth';
import { complaintRouter } from './procedures/complaint';
import { tagRouter } from './procedures/tag';
import { attachmentRouter } from './procedures/attachment';
import { callbackRouter } from './procedures/callback';
import { escalationRouter } from './procedures/escalation';
import { userRouter } from './procedures/user';
import { roleRouter } from './procedures/role';
import { reportRouter } from './procedures/report';

export const appRouter = router({
  auth: authRouter,
  complaint: complaintRouter,
  tag: tagRouter,
  attachment: attachmentRouter,
  callback: callbackRouter,
  escalation: escalationRouter,
  user: userRouter,
  role: roleRouter,
  report: reportRouter
});

export type AppRouter = typeof appRouter;
