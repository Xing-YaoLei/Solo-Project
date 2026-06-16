import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const createTRPCContext = async (event: RequestEvent) => {
  return {
    db,
    user: event.locals.user,
    session: event.locals.session,
    event
  };
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

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
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
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

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

export const createCallerFactory = t.createCallerFactory;
