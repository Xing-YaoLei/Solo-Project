import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
	transformer: superjson,
	errorFormatter({ shape }) {
		return shape;
	}
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}
	return next();
});
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.user || ctx.user.role !== 'admin') {
		throw new TRPCError({ code: 'FORBIDDEN' });
	}
	return next();
});
