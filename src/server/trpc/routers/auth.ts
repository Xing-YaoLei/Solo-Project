import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { login as luciaLogin, invalidateSession, isMockAuth } from '../../auth/lucia';
import type { SessionUser } from '../../../shared/types';

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email('邮箱格式不正确'),
        password: z.string().min(1, '密码不能为空')
      })
    )
    .mutation(async ({ input }) => {
      const result = await luciaLogin(input.email, input.password);

      if (!result) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: '用户不存在或密码错误' });
      }

      const sessionUser: SessionUser = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role
      };

      return {
        success: true,
        user: sessionUser,
        token: result.session.id
      };
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    if (ctx.session && 'id' in ctx.session) {
      await invalidateSession(ctx.session.id);
    }
    return {
      success: true,
      message: '登出成功'
    };
  }),

  getSession: protectedProcedure.query(({ ctx }) => {
    return {
      isAuthenticated: true,
      user: ctx.user
    };
  }),

  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  isMockMode: publicProcedure.query(() => {
    return isMockAuth();
  })
});
