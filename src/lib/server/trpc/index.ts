import { router } from './t';
import { authRouter } from './routes/auth';
import { quoteRouter } from './routes/quote';
import { workOrderRouter } from './routes/workorder';
import { shortageRouter } from './routes/shortage';
import { analysisRouter } from './routes/analysis';

export const appRouter = router({
  auth: authRouter,
  quote: quoteRouter,
  workorder: workOrderRouter,
  shortage: shortageRouter,
  analysis: analysisRouter
});

export type AppRouter = typeof appRouter;
