import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from './db';
import { lucia } from './auth';
import { userTable, sessionTable } from './db/schema';
import { eq } from 'drizzle-orm';

export async function createContext(event: RequestEvent) {
	const sessionId = event.cookies.get(lucia.sessionCookieName);
	let user: typeof userTable.$inferSelect | null = null;
	let session: typeof sessionTable.$inferSelect | null = null;

	if (sessionId) {
		const result = await lucia.validateSession(sessionId);
		if (result.session && result.user) {
			session = result.session as typeof sessionTable.$inferSelect;
			const userResult = await db.select().from(userTable).where(eq(userTable.id, result.user.id)).get();
			user = userResult || null;
		}
	}

	return {
		db,
		user,
		session,
		event
	};
}

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
	transformer: superjson,
	errorFormatter({ shape }) {
		return shape;
	}
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async function isAuthed(opts) {
	const { ctx } = opts;
	if (!ctx.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}
	return opts.next({
		ctx: {
			user: ctx.user
		}
	});
});
export const adminProcedure = protectedProcedure.use(async function isAdmin(opts) {
	const { ctx } = opts;
	if (ctx.user.role !== 'admin') {
		throw new TRPCError({ code: 'FORBIDDEN', message: '需要管理员权限' });
	}
	return opts.next();
});
export const managerProcedure = protectedProcedure.use(async function isManager(opts) {
	const { ctx } = opts;
	if (!['admin', 'manager'].includes(ctx.user.role)) {
		throw new TRPCError({ code: 'FORBIDDEN', message: '需要经理及以上权限' });
	}
	return opts.next();
});
export const mergeRouters = t.mergeRouters;
