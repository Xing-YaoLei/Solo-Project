import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import type { Elder, PaginatedResult, ElderStatus } from '../../../shared/types';
import { mockElders, mockCareLevels, generateId } from '../mockData';

let eldersData: Elder[] = [...mockElders];

export const elderRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        gender: z.enum(['male', 'female']).optional(),
        status: z.enum(['pending', 'admitted', 'discharged']).optional(),
        careLevelId: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10)
      })
    )
    .query(({ input }): PaginatedResult<Elder> => {
      let filtered = [...eldersData];

      if (input.search) {
        const searchLower = input.search.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.name.toLowerCase().includes(searchLower) ||
            e.idCard.includes(input.search) ||
            e.roomNumber?.toLowerCase().includes(searchLower)
        );
      }
      if (input.gender) {
        filtered = filtered.filter((e) => e.gender === input.gender);
      }
      if (input.status) {
        filtered = filtered.filter((e) => e.status === input.status);
      }
      if (input.careLevelId) {
        filtered = filtered.filter((e) => e.careLevelId === input.careLevelId);
      }

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
    .input(z.string().min(1))
    .query(({ input }): Elder => {
      const elder = eldersData.find((e) => e.id === input);
      if (!elder) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '老人档案不存在' });
      }
      return elder;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, '姓名不能为空').max(100),
        gender: z.enum(['male', 'female']),
        birthDate: z.date(),
        idCard: z.string().length(18, '身份证号必须为18位').optional(),
        roomNumber: z.string().max(50).optional(),
        admissionDate: z.date().optional(),
        allergies: z.array(z.string()).default([]),
        medicalHistory: z.array(z.string()).default([]),
        emergencyContact: z
          .object({
            name: z.string(),
            phone: z.string(),
            relation: z.string()
          })
          .optional()
      })
    )
    .mutation(({ input }): Elder => {
      const now = new Date();
      const newElder: Elder = {
        id: generateId(),
        name: input.name,
        gender: input.gender,
        birthDate: input.birthDate,
        idCard: input.idCard ?? '',
        roomNumber: input.roomNumber ?? '',
        admissionDate: input.admissionDate ?? now,
        status: 'pending',
        careLevelId: null,
        avatar: null,
        allergies: input.allergies,
        medicalHistory: input.medicalHistory,
        emergencyContact: input.emergencyContact ?? { name: '', phone: '', relation: '' },
        createdAt: now,
        updatedAt: now,
        careLevel: null
      };
      eldersData.unshift(newElder);
      return newElder;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(100).optional(),
        gender: z.enum(['male', 'female']).optional(),
        birthDate: z.date().optional(),
        idCard: z.string().length(18).optional(),
        roomNumber: z.string().max(50).optional().nullable(),
        admissionDate: z.date().optional().nullable(),
        allergies: z.array(z.string()).optional(),
        medicalHistory: z.array(z.string()).optional(),
        emergencyContact: z
          .object({
            name: z.string(),
            phone: z.string(),
            relation: z.string()
          })
          .optional()
      })
    )
    .mutation(({ input }): Elder => {
      const index = eldersData.findIndex((e) => e.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '老人档案不存在' });
      }

      const updated: Elder = {
        ...eldersData[index],
        ...input,
        updatedAt: new Date()
      };
      eldersData[index] = updated;
      return updated;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        status: z.enum(['pending', 'admitted', 'discharged'])
      })
    )
    .mutation(({ input }): Elder => {
      const index = eldersData.findIndex((e) => e.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '老人档案不存在' });
      }

      eldersData[index] = {
        ...eldersData[index],
        status: input.status as ElderStatus,
        updatedAt: new Date()
      };
      return eldersData[index];
    }),

  setCareLevel: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        careLevelId: z.string().min(1).nullable()
      })
    )
    .mutation(({ input }): Elder => {
      const index = eldersData.findIndex((e) => e.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '老人档案不存在' });
      }

      const careLevel = input.careLevelId
        ? mockCareLevels.find((cl) => cl.id === input.careLevelId) ?? null
        : null;

      eldersData[index] = {
        ...eldersData[index],
        careLevelId: input.careLevelId,
        careLevel,
        updatedAt: new Date()
      };
      return eldersData[index];
    })
});
