import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, createRoleMiddleware } from '../trpc';
import type { Medication, MedicationExecution, PaginatedResult } from '../../../shared/types';
import { mockMedications, mockMedicationExecutions, generateId } from '../mockData';

let medicationsData: Medication[] = [...mockMedications];
let executionsData: MedicationExecution[] = [...mockMedicationExecutions];

const doctorOrNurse = createRoleMiddleware('doctor', 'nurse', 'supervisor', 'admin');

export const medicationRouter = createTRPCRouter({
  listByElder: protectedProcedure
    .input(
      z.object({
        elderId: z.string().min(1),
        includeInactive: z.boolean().default(false)
      })
    )
    .query(({ input }): Medication[] => {
      let filtered = medicationsData.filter((m) => m.elderId === input.elderId);
      if (!input.includeInactive) {
        filtered = filtered.filter((m) => m.isActive);
      }
      return filtered;
    }),

  getById: protectedProcedure
    .input(z.string().min(1))
    .query(({ input }): Medication => {
      const med = medicationsData.find((m) => m.id === input);
      if (!med) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '用药记录不存在' });
      }
      return med;
    }),

  create: protectedProcedure
    .use(doctorOrNurse)
    .input(
      z.object({
        elderId: z.string().min(1),
        name: z.string().min(1, '药品名称不能为空').max(200),
        dosage: z.string().min(1, '剂量不能为空').max(100),
        frequency: z.string().min(1, '频次不能为空').max(100),
        route: z.string().min(1, '给药方式不能为空').max(50),
        startDate: z.date(),
        endDate: z.date().optional().nullable(),
        prescribedBy: z.string().max(100).optional(),
        notes: z.string().optional()
      })
    )
    .mutation(({ input }): Medication => {
      const newMed: Medication = {
        id: generateId(),
        elderId: input.elderId,
        name: input.name,
        dosage: input.dosage,
        frequency: input.frequency,
        route: input.route,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
        prescribedBy: input.prescribedBy ?? '',
        notes: input.notes ?? '',
        isActive: true
      };
      medicationsData.unshift(newMed);
      return newMed;
    }),

  update: protectedProcedure
    .use(doctorOrNurse)
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(200).optional(),
        dosage: z.string().min(1).max(100).optional(),
        frequency: z.string().min(1).max(100).optional(),
        route: z.string().min(1).max(50).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional().nullable(),
        prescribedBy: z.string().max(100).optional(),
        notes: z.string().optional().nullable(),
        isActive: z.boolean().optional()
      })
    )
    .mutation(({ input }): Medication => {
      const index = medicationsData.findIndex((m) => m.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '用药记录不存在' });
      }

      medicationsData[index] = {
        ...medicationsData[index],
        ...input,
        notes: input.notes ?? medicationsData[index].notes
      };
      return medicationsData[index];
    }),

  recordExecution: protectedProcedure
    .use(doctorOrNurse)
    .input(
      z.object({
        medicationId: z.string().min(1),
        executedAt: z.date().default(() => new Date()),
        signature: z.string().optional().nullable(),
        isAbnormal: z.boolean().default(false),
        abnormalNote: z.string().optional()
      })
    )
    .mutation(({ input, ctx }): MedicationExecution => {
      const med = medicationsData.find((m) => m.id === input.medicationId);
      if (!med) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '用药记录不存在' });
      }

      const execution: MedicationExecution = {
        id: generateId(),
        medicationId: input.medicationId,
        executedAt: input.executedAt,
        executedBy: ctx.user?.name,
        signature: input.signature ?? null,
        isAbnormal: input.isAbnormal,
        abnormalNote: input.abnormalNote ?? null
      };
      executionsData.unshift(execution);
      return execution;
    }),

  listExecutions: protectedProcedure
    .input(
      z.object({
        medicationId: z.string().min(1).optional(),
        elderId: z.string().min(1).optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20)
      })
    )
    .query(({ input }): PaginatedResult<MedicationExecution> => {
      let filtered = [...executionsData];

      if (input.medicationId) {
        filtered = filtered.filter((e) => e.medicationId === input.medicationId);
      }
      if (input.elderId) {
        const elderMeds = medicationsData.filter((m) => m.elderId === input.elderId).map((m) => m.id);
        filtered = filtered.filter((e) => elderMeds.includes(e.medicationId));
      }

      filtered.sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime());

      const total = filtered.length;
      const start = (input.page - 1) * input.pageSize;
      const items = filtered.slice(start, start + input.pageSize);

      return {
        items,
        total,
        page: input.page,
        pageSize: input.pageSize
      };
    })
});
