import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context';
import superjson from 'superjson';
import { ZodError } from 'zod';

const t = initTRPC.context<Context>().create({
	transformer: superjson,
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

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED', message: '未登录' });
	}
	return next({
		ctx: { ...ctx, user: ctx.user }
	});
});

export const createRoleProcedure = (allowedRoles: Array<'admin' | 'manager' | 'nurse' | 'caregiver'>) =>
	protectedProcedure.use(({ ctx, next }) => {
		if (!allowedRoles.includes(ctx.user.role)) {
			throw new TRPCError({ code: 'FORBIDDEN', message: '权限不足' });
		}
		return next({ ctx });
	});

export const adminProcedure = createRoleProcedure(['admin']);
export const managerProcedure = createRoleProcedure(['admin', 'manager']);
export const nurseProcedure = createRoleProcedure(['admin', 'manager', 'nurse']);
export const caregiverProcedure = createRoleProcedure(['admin', 'manager', 'nurse', 'caregiver']);

export const createCallerFactory = t.createCallerFactory;
