import type { RequestEvent } from '@sveltejs/kit';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { lucia } from '../lucia';
import { db } from '../db';

export const createTRPCContext = async (event: RequestEvent) => {
  const sessionId = event.cookies.get(lucia.sessionCookieName);
  
  let user = null;
  let session = null;
  
  if (sessionId) {
    try {
      const result = await lucia.validateSession(sessionId);
      user = result.user;
      session = result.session;
      
      if (session?.fresh) {
        const sessionCookie = lucia.createSessionCookie(session.id);
        event.cookies.set(sessionCookie.name, sessionCookie.value, {
          path: '.',
          ...sessionCookie.attributes
        });
      }
      
      if (!session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        event.cookies.set(sessionCookie.name, sessionCookie.value, {
          path: '.',
          ...sessionCookie.attributes
        });
      }
    } catch {
      // ignore
    }
  }

  return {
    db,
    user,
    session,
    event
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
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

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
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

const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next();
});

export const adminProcedure = t.procedure.use(enforceUserIsAuthed).use(enforceUserIsAdmin);

const enforceUserIsManager = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !['admin', 'manager'].includes(ctx.user.role)) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next();
});

export const managerProcedure = t.procedure.use(enforceUserIsAuthed).use(enforceUserIsManager);
