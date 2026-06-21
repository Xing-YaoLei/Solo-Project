import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context';
import { z } from 'zod';

const t = initTRPC.context<Context>().create({
	errorFormatter({ shape }) {
		return shape;
	}
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
export const mergeRouters = t.mergeRouters;

const isAuthed = middleware(({ ctx, next }) => {
	if (!ctx.user || !ctx.session) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}
	return next({
		ctx: {
			user: ctx.user,
			session: ctx.session
		}
	});
});

const isWorker = middleware(({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}
	if (ctx.user.role !== 'worker' && ctx.user.role !== 'manager' && ctx.user.role !== 'admin') {
		throw new TRPCError({ code: 'FORBIDDEN' });
	}
	return next();
});

const isManager = middleware(({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}
	if (ctx.user.role !== 'manager' && ctx.user.role !== 'admin') {
		throw new TRPCError({ code: 'FORBIDDEN' });
	}
	return next();
});

const isAdmin = middleware(({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}
	if (ctx.user.role !== 'admin') {
		throw new TRPCError({ code: 'FORBIDDEN' });
	}
	return next();
});

export const protectedProcedure = publicProcedure.use(isAuthed);
export const workerProcedure = publicProcedure.use(isAuthed).use(isWorker);
export const managerProcedure = publicProcedure.use(isAuthed).use(isManager);
export const adminProcedure = publicProcedure.use(isAuthed).use(isAdmin);
