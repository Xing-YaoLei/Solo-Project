import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';

export const createTRPCContext = async (opts: {
	user: {
		id: string;
		username: string;
		role: string;
		realName?: string | null;
		region?: string | null;
	} | null;
	sessionId: string | null;
}) => {
	return {
		user: opts.user,
		sessionId: opts.sessionId
	};
};

const t = initTRPC.context<typeof createTRPCContext>().create({
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError: error.cause instanceof ZodError ? error.cause.flatten() : null
			}
		};
	}
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}
	return next({
		ctx: {
			user: ctx.user,
			sessionId: ctx.sessionId
		}
	});
});
