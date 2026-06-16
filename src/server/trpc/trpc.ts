import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import superjson from 'superjson';
import type { TrpcContext } from './context';
import type { UserRole, SessionUser } from '../../shared/types';

const t = initTRPC.context<TrpcContext>().create({
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
export const createTRPCRouter = t.router;
export const mergeRouters = t.mergeRouters;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: '未登录，请先登录'
    });
  }
  return next({
    ctx: {
      user: ctx.user as SessionUser,
      session: ctx.session
    }
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

type RoleRequirement = UserRole | UserRole[];

function checkRole(userRole: UserRole, required: RoleRequirement): boolean {
  if (Array.isArray(required)) {
    return required.includes(userRole);
  }
  return userRole === required;
}

function normalizeRoles(...roles: RoleRequirement[]): UserRole[] {
  const result: UserRole[] = [];
  for (const r of roles) {
    if (Array.isArray(r)) result.push(...r);
    else result.push(r);
  }
  return result;
}

export function createRoleMiddleware(...requiredRoles: RoleRequirement[]) {
  const normalized = normalizeRoles(...requiredRoles);
  return t.middleware(({ ctx, next }) => {
    if (!ctx.user || !ctx.session) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: '未登录，请先登录'
      });
    }

    if (!normalized.includes(ctx.user.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '权限不足，无法执行此操作'
      });
    }

    return next({
      ctx: {
        user: ctx.user as SessionUser,
        session: ctx.session
      }
    });
  });
}

export const adminProcedure = t.procedure.use(createRoleMiddleware('admin'));

export const supervisorProcedure = t.procedure.use(
  createRoleMiddleware(['admin', 'supervisor'])
);

export const nurseProcedure = t.procedure.use(
  createRoleMiddleware(['admin', 'supervisor', 'nurse'])
);

export const doctorProcedure = t.procedure.use(
  createRoleMiddleware(['admin', 'supervisor', 'doctor'])
);

export const staffProcedure = t.procedure.use(
  createRoleMiddleware(['admin', 'supervisor', 'nurse', 'doctor'])
);

export const familyProcedure = t.procedure.use(
  createRoleMiddleware(['admin', 'supervisor', 'nurse', 'doctor', 'family'])
);

export function roleProcedure(roles: RoleRequirement) {
  return t.procedure.use(createRoleMiddleware(roles));
}

export type { TrpcContext };
