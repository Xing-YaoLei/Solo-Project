import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import type { SessionUser } from '../../../shared/types';
import { mockUsers } from '../mockData';

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email('邮箱格式不正确'),
        password: z.string().min(1, '密码不能为空')
      })
    )
    .mutation(async ({ input }) => {
      const user = mockUsers.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: '用户不存在或密码错误' });
      }
      const validPasswords = ['password123', 'admin123', 'super123', 'nurse123', 'doctor123'];
      if (!validPasswords.includes(input.password)) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: '用户不存在或密码错误' });
      }
      if (!user.isActive) {
        throw new TRPCError({ code: 'FORBIDDEN', message: '账号已被禁用' });
      }

      const sessionUser: SessionUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };

      return {
        success: true,
        user: sessionUser,
        token: `mock-token-${user.id}-${Date.now()}`
      };
    }),

  logout: publicProcedure.mutation(() => {
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
  })
});
