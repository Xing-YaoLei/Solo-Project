import { router } from './trpc';
import { authRouter } from './routes/auth';
import { coursesRouter } from './routes/courses';
import { questionsRouter } from './routes/questions';
import { progressRouter } from './routes/progress';
import { todosRouter } from './routes/todos';
import { reportsRouter } from './routes/reports';
import { settingsRouter } from './routes/settings';
import { usersRouter } from './routes/users';
import { createContext } from './context';
import { createCallerFactory } from './trpc';

export const appRouter = router({
	auth: authRouter,
	courses: coursesRouter,
	questions: questionsRouter,
	progress: progressRouter,
	todos: todosRouter,
	reports: reportsRouter,
	settings: settingsRouter,
	users: usersRouter
});

export type AppRouter = typeof appRouter;

export { createContext, createCallerFactory };
