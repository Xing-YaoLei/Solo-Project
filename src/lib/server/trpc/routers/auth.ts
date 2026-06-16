import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { hash, verify } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';
import { users } from '../../db/schema';
import { lucia } from '../../lucia';
import { TRPCError } from '@trpc/server';

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [existingUser] = await ctx.db.select().from(users).where(eq(users.email, input.email));
      if (!existingUser) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: '邮箱或密码错误' });
      }

      const validPassword = await verify(existingUser.hashedPassword, input.password, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1
      });

      if (!validPassword) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: '邮箱或密码错误' });
      }

      const session = await lucia.createSession(existingUser.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      ctx.event.cookies.set(sessionCookie.name, sessionCookie.value, {
        path: '.',
        ...sessionCookie.attributes
      });

      return {
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role
        }
      };
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    await lucia.invalidateSession(ctx.session.id);
    const sessionCookie = lucia.createBlankSessionCookie();
    ctx.event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes
    });
    return { success: true };
  }),

  getCurrentUser: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  })
});
