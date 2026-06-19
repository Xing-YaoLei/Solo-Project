import { router } from '../trpc';
import { userRouter } from './user';
import { propertyRouter } from './property';
import { cleaningTaskRouter } from './cleaningTask';
import { bookingRouter } from './booking';
import { complaintRouter } from './complaint';
import { anomalyRouter } from './anomaly';
import { calendarRouter } from './calendar';
import { reportRouter } from './report';

export const appRouter = router({
	user: userRouter,
	property: propertyRouter,
	cleaningTask: cleaningTaskRouter,
	booking: bookingRouter,
	complaint: complaintRouter,
	anomaly: anomalyRouter,
	calendar: calendarRouter,
	report: reportRouter
});

export type AppRouter = typeof appRouter;
