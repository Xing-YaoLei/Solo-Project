import { initTRPC, TRPCError } from '@trpc/server';
import type { RequestEvent } from '@sveltejs/kit';
import superjson from 'superjson';
import { db } from '$server/db';

interface UserContext {
  id: string;
  username: string;
  displayName: string;
  roleId: string;
  roleName: string;
  phone: string | null;
  permissions: string[];
}

export type Context = {
  event: RequestEvent;
  user: UserContext | null;
  db: typeof db;
};

export async function createContext(event: RequestEvent): Promise<Context> {
  const { user } = event.locals;

  if (!user) {
    return { event, user: null, db };
  }

  return {
    event,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      roleId: user.roleId,
      roleName: user.roleName,
      phone: user.phone ?? null,
      permissions: user.permissions
    },
    db
  };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

export const authedProcedure = t.procedure.use(
  middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);

export function createPermissionGuard(codes: string[]) {
  return middleware(async ({ ctx, next }) => {
    const user = ctx.user;
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' });
    }
    const hasPermission = codes.some((code) => user.permissions.includes(code));
    if (!hasPermission) {
      throw new TRPCError({ code: 'FORBIDDEN', message: '权限不足' });
    }
    return next({ ctx: { ...ctx, user } });
  });
}
