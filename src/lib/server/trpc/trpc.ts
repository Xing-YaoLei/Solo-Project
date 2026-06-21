import { initTRPC, TRPCError } from '@trpc/server';
import { transformer } from './transformer';
import type { Context } from './context';
import type { UserRole } from '$lib/shared/types';

const t = initTRPC.context<Context>().create({
	transformer,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError: error.cause instanceof Error ? error.cause.message : undefined
			}
		};
	}
});

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}
	return next({
		ctx: {
			user: ctx.user
		}
	});
});

export const protectedProcedure = t.procedure.use(isAuthed);

const requireRole = (...roles: UserRole[]) =>
	t.middleware(({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({ code: 'UNAUTHORIZED' });
		}
		const userRole = (ctx.user.role ?? 'viewer') as UserRole;
		if (!roles.includes(userRole)) {
			throw new TRPCError({ code: 'FORBIDDEN', message: '权限不足' });
		}
		return next({ ctx: { user: ctx.user } });
	});

export const adminProcedure = protectedProcedure.use(requireRole('admin'));
export const operatorProcedure = protectedProcedure.use(requireRole('admin', 'operator'));
export const financeProcedure = protectedProcedure.use(requireRole('admin', 'finance'));

export const createCallerFactory = t.createCallerFactory;
