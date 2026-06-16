import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, createRoleMiddleware } from '../trpc';
import type { CareLevel } from '../../../shared/types';
import { mockCareLevels, generateId } from '../mockData';

let careLevelsData: CareLevel[] = [...mockCareLevels];

const adminOrSupervisor = createRoleMiddleware('admin', 'supervisor');

export const careLevelRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        includeInactive: z.boolean().default(false)
      })
    )
    .query(({ input }): CareLevel[] => {
      if (input.includeInactive) {
        return [...careLevelsData];
      }
      return careLevelsData.filter((cl) => cl.isActive);
    }),

  getById: protectedProcedure
    .input(z.string().min(1))
    .query(({ input }): CareLevel => {
      const level = careLevelsData.find((cl) => cl.id === input);
      if (!level) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '护理等级不存在' });
      }
      return level;
    }),

  create: protectedProcedure
    .use(adminOrSupervisor)
    .input(
      z.object({
        name: z.string().min(1, '名称不能为空').max(50),
        scoreRange: z.object({
          min: z.number().min(0).max(100),
          max: z.number().min(0).max(100)
        }).refine((r) => r.min <= r.max, '最小值不能大于最大值'),
        description: z.string().optional(),
        careItems: z.array(z.string()).default([])
      })
    )
    .mutation(({ input }): CareLevel => {
      const exists = careLevelsData.some((cl) => cl.name === input.name);
      if (exists) {
        throw new TRPCError({ code: 'CONFLICT', message: '护理等级名称已存在' });
      }

      const newLevel: CareLevel = {
        id: generateId(),
        name: input.name,
        scoreRange: input.scoreRange,
        description: input.description ?? '',
        careItems: input.careItems,
        isActive: true
      };
      careLevelsData.push(newLevel);
      return newLevel;
    }),

  update: protectedProcedure
    .use(adminOrSupervisor)
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(50).optional(),
        scoreRange: z
          .object({
            min: z.number().min(0).max(100),
            max: z.number().min(0).max(100)
          })
          .refine((r) => r.min <= r.max, '最小值不能大于最大值')
          .optional(),
        description: z.string().optional().nullable(),
        careItems: z.array(z.string()).optional()
      })
    )
    .mutation(({ input }): CareLevel => {
      const index = careLevelsData.findIndex((cl) => cl.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '护理等级不存在' });
      }

      if (input.name) {
        const nameExists = careLevelsData.some(
          (cl) => cl.id !== input.id && cl.name === input.name
        );
        if (nameExists) {
          throw new TRPCError({ code: 'CONFLICT', message: '护理等级名称已存在' });
        }
      }

      careLevelsData[index] = {
        ...careLevelsData[index],
        ...input,
        description: input.description ?? careLevelsData[index].description
      };
      return careLevelsData[index];
    }),

  toggle: protectedProcedure
    .use(adminOrSupervisor)
    .input(z.string().min(1))
    .mutation(({ input }): CareLevel => {
      const index = careLevelsData.findIndex((cl) => cl.id === input);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '护理等级不存在' });
      }

      careLevelsData[index] = {
        ...careLevelsData[index],
        isActive: !careLevelsData[index].isActive
      };
      return careLevelsData[index];
    })
});
