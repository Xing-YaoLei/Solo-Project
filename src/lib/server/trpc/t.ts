import { initTRPC, TRPCError } from '@trpc/server';
import type { RequestEvent } from '@sveltejs/kit';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { hasPermission } from '$auth';
import type { UserRole } from '$auth';

export interface Context {
  event: RequestEvent;
  user: {
    id: string;
    username: string;
    name: string;
    role: string;
    region?: string | null;
  } | null;
}

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

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      user: ctx.user
    }
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

export function requirePermission(permission: string) {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    if (!hasPermission(ctx.user.role, permission)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: '权限不足' });
    }
    return next();
  });
}

export const adminProcedure = protectedProcedure.use(requirePermission('all'));
export const frontlineProcedure = protectedProcedure.use(requirePermission('workorder:create'));
export const managerProcedure = protectedProcedure.use(requirePermission('shortage:process'));
export const analystProcedure = protectedProcedure.use(requirePermission('analysis:read'));

export function createCallerFactory() {
  return t.createCallerFactory;
}
