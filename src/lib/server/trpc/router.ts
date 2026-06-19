import { publicProcedure } from './init';
import { t } from './init';
import { performanceRouter } from './routers/performance';
import { seatRouter } from './routers/seat';
import { checkinRouter } from './routers/checkin';
import { sponsorRouter } from './routers/sponsor';
import { exceptionRouter } from './routers/exception';
import { reportRouter } from './routers/report';

export const rootRouter = t.router({
	performance: performanceRouter,
	seat: seatRouter,
	checkin: checkinRouter,
	sponsor: sponsorRouter,
	exception: exceptionRouter,
	report: reportRouter
});

export type AppRouter = typeof rootRouter;
