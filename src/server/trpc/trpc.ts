import { initTRPC, TRPCError } from '@trpc/server';
import type { TRPCContext } from './context';
import { hasPermission } from '../auth/permissions';
import type { UserRoleCode } from '../db/schema/roles';
import { z } from 'zod';

const t = initTRPC.context<TRPCContext>().create({
	errorFormatter({ shape }) {
		return shape;
	}
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED', message: '未登录' });
	}
	return next({ ctx: { ...ctx, user: ctx.user } });
});

export function requirePermission(permission: string) {
	return t.procedure.use(async ({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({ code: 'UNAUTHORIZED', message: '未登录' });
		}

		if (!hasPermission(ctx.user.permissions, permission)) {
			throw new TRPCError({ code: 'FORBIDDEN', message: '权限不足' });
		}

		return next({ ctx: { ...ctx, user: ctx.user } });
	});
}

export function requireRole(roles: UserRoleCode[]) {
	return t.procedure.use(async ({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({ code: 'UNAUTHORIZED', message: '未登录' });
		}

		const hasRole = ctx.user.roles.some((r) => roles.includes(r));
		if (!hasRole) {
			throw new TRPCError({ code: 'FORBIDDEN', message: '权限不足' });
		}

		return next({ ctx: { ...ctx, user: ctx.user } });
	});
}

export { z };
