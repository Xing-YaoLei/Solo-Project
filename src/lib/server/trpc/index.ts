import { initTRPC } from '@trpc/server';
import type { RequestEvent } from '@sveltejs/kit';
import { lucia } from '$server/auth';

type Context = {
	event: RequestEvent;
	user: {
		id: string;
		username: string;
		displayName: string;
		role: string;
	} | null;
	sessionId: string | null;
};

export async function createContext(event: RequestEvent): Promise<Context> {
	const sessionId = event.cookies.get(lucia.sessionCookieName);
	if (!sessionId) {
		return { event, user: null, sessionId: null };
	}

	const { session, user } = await lucia.validateSession(sessionId);
	if (!session || !user) {
		return { event, user: null, sessionId: null };
	}

	return {
		event,
		user: {
			id: user.id,
			username: user.username,
			displayName: user.displayName,
			role: user.role
		},
		sessionId: session.id
	};
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const authenticatedProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.user) {
		throw new Error('未登录');
	}
	return next({ ctx: { ...ctx, user: ctx.user } });
});

export const roleProcedure = (...roles: string[]) =>
	t.procedure.use(async ({ ctx, next }) => {
		if (!ctx.user) {
			throw new Error('未登录');
		}
		if (!roles.includes(ctx.user.role)) {
			throw new Error('无权限');
		}
		return next({ ctx: { ...ctx, user: ctx.user } });
	});
