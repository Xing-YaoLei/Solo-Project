import { router } from './trpc';
import { authRouter } from './routes/auth';
import { eventRouter } from './routes/event';
import { sponsorRouter } from './routes/sponsor';
import { verificationRouter } from './routes/verification';
import { ticketTypeRouter } from './routes/ticket-type';
import { orderRouter } from './routes/order';
import { seatRouter } from './routes/seat';
import { disputeRouter } from './routes/dispute';
import { transitionRouter } from './routes/transition';
import { exportRouter } from './routes/export';

export const appRouter = router({
	auth: authRouter,
	event: eventRouter,
	sponsor: sponsorRouter,
	verification: verificationRouter,
	ticketType: ticketTypeRouter,
	order: orderRouter,
	seat: seatRouter,
	dispute: disputeRouter,
	transition: transitionRouter,
	export: exportRouter
});

export type AppRouter = typeof appRouter;
