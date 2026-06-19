import { initTRPC, TRPCError } from '@trpc/server';
import type { RequestEvent } from '@sveltejs/kit';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { User } from 'lucia';
import { db } from '$server/db';
import type { UserRole } from '$lib/types';

export interface TRPCContext {
	db: typeof db;
	user: User | null;
	event: RequestEvent;
}

const t = initTRPC.context<TRPCContext>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError:
					error.cause instanceof ZodError ? error.cause.flatten() : null
			}
		};
	}
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}
	return next({
		ctx: {
			...ctx,
			user: ctx.user
		}
	});
});

export const roleProcedure = (allowedRoles: UserRole[]) =>
	protectedProcedure.use(({ ctx, next }) => {
		if (!allowedRoles.includes(ctx.user.role)) {
			throw new TRPCError({ code: 'FORBIDDEN', message: '权限不足' });
		}
		return next({ ctx });
	});

export const createCallerFactory = t.createCallerFactory;
