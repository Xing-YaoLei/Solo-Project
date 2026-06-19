import { initTRPC, TRPCError } from '@trpc/server';
import type { RequestEvent } from '@sveltejs/kit';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { User } from 'lucia';
import type { UserRole } from '$lib/server/db/schema';

export const createTRPCContext = async (event: RequestEvent) => {
	return {
		user: event.locals.user,
		session: event.locals.session,
		cookies: event.cookies,
		setHeaders: event.setHeaders
	};
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

export interface AuthUser extends User {
	id: string;
	username: string;
	name: string;
	role: UserRole;
}

const t = initTRPC.context<TRPCContext>().create({
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

export const createTRPCRouter = t.router;
export const mergeRouters = t.mergeRouters;

export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
	if (!ctx.user || !ctx.session) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}
	return next({
		ctx: {
			user: ctx.user as AuthUser,
			session: ctx.session
		}
	});
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

export const createRoleGuard = (roles: UserRole[]) =>
	t.middleware(({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({ code: 'UNAUTHORIZED' });
		}
		const user = ctx.user as AuthUser;
		if (!roles.includes(user.role)) {
			throw new TRPCError({ code: 'FORBIDDEN', message: '权限不足' });
		}
		return next();
	});

export const managerProcedure = protectedProcedure.use(createRoleGuard(['MANAGER']));
export const advisorOrManagerProcedure = protectedProcedure.use(
	createRoleGuard(['ADVISOR', 'MANAGER'])
);
export const partsOrManagerProcedure = protectedProcedure.use(
	createRoleGuard(['PARTS', 'MANAGER'])
);
export const technicianOrManagerProcedure = protectedProcedure.use(
	createRoleGuard(['TECHNICIAN', 'MANAGER'])
);

export const createCallerFactory = t.createCallerFactory;
