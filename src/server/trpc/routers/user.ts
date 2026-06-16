import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, createRoleMiddleware } from '../trpc';
import type { User, UserRole, PaginatedResult } from '../../../shared/types';
import { mockUsers, generateId } from '../mockData';

function toDate(date: Date | string): Date {
  return date instanceof Date ? date : new Date(date);
}

let usersData: User[] = [...mockUsers];

const adminRole = createRoleMiddleware('admin');

export const userRouter = createTRPCRouter({
  list: protectedProcedure
    .use(adminRole)
    .input(
      z.object({
        search: z.string().optional(),
        role: z.enum(['admin', 'supervisor', 'nurse', 'doctor', 'family']).optional(),
        isActive: z.boolean().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10)
      })
    )
    .query(({ input }): PaginatedResult<User> => {
      let filtered = [...usersData];

      if (input.search) {
        const searchLower = input.search.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.name.toLowerCase().includes(searchLower) ||
            u.email.toLowerCase().includes(searchLower)
        );
      }
      if (input.role) {
        filtered = filtered.filter((u) => u.role === input.role);
      }
      if (typeof input.isActive === 'boolean') {
        filtered = filtered.filter((u) => u.isActive === input.isActive);
      }

      filtered.sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());

      const total = filtered.length;
      const start = (input.page - 1) * input.pageSize;
      const items = filtered.slice(start, start + input.pageSize);

      return {
        items,
        total,
        page: input.page,
        pageSize: input.pageSize
      };
    }),

  getById: protectedProcedure
    .use(adminRole)
    .input(z.string().min(1))
    .query(({ input }): User => {
      const user = usersData.find((u) => u.id === input);
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '用户不存在' });
      }
      return user;
    }),

  getCurrent: protectedProcedure.query(({ ctx }): User => {
    const user = usersData.find((u) => u.id === ctx.user?.id);
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '用户不存在' });
    }
    return user;
  }),

  create: protectedProcedure
    .use(adminRole)
    .input(
      z.object({
        email: z.string().email('邮箱格式不正确'),
        name: z.string().min(1, '姓名不能为空').max(100),
        role: z.enum(['admin', 'supervisor', 'nurse', 'doctor', 'family'])
      })
    )
    .mutation(({ input }): User => {
      const exists = usersData.some((u) => u.email === input.email);
      if (exists) {
        throw new TRPCError({ code: 'CONFLICT', message: '邮箱已被使用' });
      }

      const now = new Date();
      const newUser: User = {
        id: generateId(),
        email: input.email,
        name: input.name,
        role: input.role as UserRole,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };
      usersData.unshift(newUser);
      return newUser;
    }),

  update: protectedProcedure
    .use(adminRole)
    .input(
      z.object({
        id: z.string().min(1),
        email: z.string().email().optional(),
        name: z.string().min(1).max(100).optional(),
        isActive: z.boolean().optional()
      })
    )
    .mutation(({ input }): User => {
      const index = usersData.findIndex((u) => u.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '用户不存在' });
      }

      if (input.email) {
        const emailExists = usersData.some(
          (u) => u.id !== input.id && u.email === input.email
        );
        if (emailExists) {
          throw new TRPCError({ code: 'CONFLICT', message: '邮箱已被使用' });
        }
      }

      usersData[index] = {
        ...usersData[index],
        ...input,
        updatedAt: new Date()
      };
      return usersData[index];
    }),

  updateRole: protectedProcedure
    .use(adminRole)
    .input(
      z.object({
        id: z.string().min(1),
        role: z.enum(['admin', 'supervisor', 'nurse', 'doctor', 'family'])
      })
    )
    .mutation(({ input }): User => {
      const index = usersData.findIndex((u) => u.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '用户不存在' });
      }

      usersData[index] = {
        ...usersData[index],
        role: input.role as UserRole,
        updatedAt: new Date()
      };
      return usersData[index];
    }),

  toggleActive: protectedProcedure
    .use(adminRole)
    .input(z.string().min(1))
    .mutation(({ input }): User => {
      const index = usersData.findIndex((u) => u.id === input);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '用户不存在' });
      }

      usersData[index] = {
        ...usersData[index],
        isActive: !usersData[index].isActive,
        updatedAt: new Date()
      };
      return usersData[index];
    }),

  listByRole: protectedProcedure
    .input(z.enum(['admin', 'supervisor', 'nurse', 'doctor', 'family']))
    .query(({ input }): User[] => {
      return usersData.filter((u) => u.role === input && u.isActive);
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        oldPassword: z.string().min(1),
        newPassword: z.string().min(6, '新密码至少6位')
      })
    )
    .mutation((): { success: boolean } => {
      return { success: true };
    })
});
