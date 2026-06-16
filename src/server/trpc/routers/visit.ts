import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, createRoleMiddleware } from '../trpc';
import type { VisitRecord, PaginatedResult } from '../../../shared/types';
import { mockVisitRecords, generateId } from '../mockData';

let visitRecordsData: VisitRecord[] = [...mockVisitRecords];

const staffRole = createRoleMiddleware('admin', 'supervisor', 'nurse', 'doctor');

export const visitRouter = createTRPCRouter({
  listByElder: protectedProcedure
    .input(
      z.object({
        elderId: z.string().min(1),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20)
      })
    )
    .query(({ input }): PaginatedResult<VisitRecord> => {
      let filtered = visitRecordsData.filter((v) => v.elderId === input.elderId);
      filtered.sort((a, b) => b.visitTime.getTime() - a.visitTime.getTime());

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
    .query(({ input }): VisitRecord => {
      const record = visitRecordsData.find((v) => v.id === input);
      if (!record) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '探访记录不存在' });
      }
      return record;
    }),

  create: protectedProcedure
    .use(staffRole)
    .input(
      z.object({
        elderId: z.string().min(1),
        visitorName: z.string().min(1, '探访人姓名不能为空').max(100),
        relation: z.string().max(50).optional(),
        visitorPhone: z.string().max(20).optional(),
        visitTime: z.date().default(() => new Date()),
        notes: z.string().optional()
      })
    )
    .mutation(({ input, ctx }): VisitRecord => {
      const newRecord: VisitRecord = {
        id: generateId(),
        elderId: input.elderId,
        visitorName: input.visitorName,
        relation: input.relation ?? '',
        visitorPhone: input.visitorPhone ?? '',
        visitTime: input.visitTime,
        leaveTime: null,
        notes: input.notes ?? '',
        recordedBy: ctx.user?.name
      };
      visitRecordsData.unshift(newRecord);
      return newRecord;
    }),

  update: protectedProcedure
    .use(staffRole)
    .input(
      z.object({
        id: z.string().min(1),
        visitorName: z.string().min(1).max(100).optional(),
        relation: z.string().max(50).optional().nullable(),
        visitorPhone: z.string().max(20).optional().nullable(),
        visitTime: z.date().optional(),
        notes: z.string().optional().nullable()
      })
    )
    .mutation(({ input }): VisitRecord => {
      const index = visitRecordsData.findIndex((v) => v.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '探访记录不存在' });
      }

      visitRecordsData[index] = {
        ...visitRecordsData[index],
        ...input,
        relation: input.relation ?? visitRecordsData[index].relation,
        visitorPhone: input.visitorPhone ?? visitRecordsData[index].visitorPhone,
        notes: input.notes ?? visitRecordsData[index].notes
      };
      return visitRecordsData[index];
    }),

  markLeft: protectedProcedure
    .use(staffRole)
    .input(
      z.object({
        id: z.string().min(1),
        leaveTime: z.date().default(() => new Date())
      })
    )
    .mutation(({ input }): VisitRecord => {
      const index = visitRecordsData.findIndex((v) => v.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '探访记录不存在' });
      }

      visitRecordsData[index] = {
        ...visitRecordsData[index],
        leaveTime: input.leaveTime
      };
      return visitRecordsData[index];
    }),

  todayList: protectedProcedure
    .use(staffRole)
    .query((): VisitRecord[] => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return visitRecordsData
        .filter((v) => v.visitTime >= today && v.visitTime < tomorrow)
        .sort((a, b) => b.visitTime.getTime() - a.visitTime.getTime());
    })
});
