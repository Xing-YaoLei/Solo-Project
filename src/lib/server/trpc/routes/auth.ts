import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../context';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { Argon2id } from 'oslo/password';
import { generateId } from 'lucia';
import { lucia } from '../../lucia';

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(z.object({
      username: z.string().min(1),
      password: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.db.query.users.findFirst({
        where: eq(users.username, input.username)
      });

      if (!existingUser) {
        return { success: false, error: '用户名或密码错误' };
      }

      const validPassword = await new Argon2id().verify(
        existingUser.passwordHash,
        input.password
      );

      if (!validPassword) {
        return { success: false, error: '用户名或密码错误' };
      }

      const session = await lucia.createSession(existingUser.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      
      ctx.event.cookies.set(sessionCookie.name, sessionCookie.value, {
        path: '.',
        ...sessionCookie.attributes
      });

      return { 
        success: true, 
        user: {
          id: existingUser.id,
          username: existingUser.username,
          name: existingUser.name,
          role: existingUser.role,
          pharmacyId: existingUser.pharmacyId
        }
      };
    }),

  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.session) {
        await lucia.invalidateSession(ctx.session.id);
      }
      const sessionCookie = lucia.createBlankSessionCookie();
      ctx.event.cookies.set(sessionCookie.name, sessionCookie.value, {
        path: '.',
        ...sessionCookie.attributes
      });
      return { success: true };
    }),

  getCurrentUser: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.user;
    }),

  register: publicProcedure
    .input(z.object({
      username: z.string().min(3).max(50),
      password: z.string().min(6),
      name: z.string().min(1),
      role: z.enum(['admin', 'manager', 'pharmacist', 'staff']).default('staff')
    }))
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.db.query.users.findFirst({
        where: eq(users.username, input.username)
      });

      if (existingUser) {
        return { success: false, error: '用户名已存在' };
      }

      const userId = generateId(15);
      const hashedPassword = await new Argon2id().hash(input.password);

      await ctx.db.insert(users).values({
        id: userId,
        username: input.username,
        name: input.name,
        passwordHash: hashedPassword,
        role: input.role
      });

      return { success: true };
    })
});
