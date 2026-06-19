import { z } from 'zod';
import { publicProcedure, router, protectedProcedure } from '../t';
import { db } from '$db';
import { users } from '$db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { lucia } from '$auth';
import { TRPCError } from '@trpc/server';

export const authRouter = router({
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1)
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [user] = await db.select().from(users).where(eq(users.username, input.username)).limit(1);

      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: '用户名或密码错误' });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: '用户名或密码错误' });
      }

      const session = await lucia.createSession(user.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      ctx.event.cookies.set(sessionCookie.name, sessionCookie.value, {
        path: '.',
        ...sessionCookie.attributes
      });

      return {
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          region: user.region,
          createdAt: user.createdAt
        }
      };
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.event.locals.session?.id) {
      await lucia.invalidateSession(ctx.event.locals.session.id);
    }
    const cookie = lucia.createBlankSessionCookie();
    ctx.event.cookies.set(cookie.name, cookie.value, {
      path: '.',
      ...cookie.attributes
    });
    return { success: true };
  }),

  getCurrentUser: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  createUser: protectedProcedure
    .input(
      z.object({
        username: z.string().min(3).max(50),
        password: z.string().min(6),
        name: z.string().min(1).max(100),
        role: z.enum(['admin', 'frontline', 'manager', 'analyst']),
        region: z.string().optional()
      })
    )
    .mutation(async ({ input }) => {
      const hashedPassword = await bcrypt.hash(input.password, 10);
      const [newUser] = await db
        .insert(users)
        .values({
          username: input.username,
          passwordHash: hashedPassword,
          name: input.name,
          role: input.role,
          region: input.region
        })
        .returning();
      return newUser;
    })
});
