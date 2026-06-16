import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import {
  patients,
  followupTasks,
  medicalRecords,
  treatmentPlans,
  exceptionOrders,
  exportLogs
} from '../../db/schema';
import { eq, desc, and, count, gte, lte, sql } from 'drizzle-orm';

export const statisticsRouter = createTRPCRouter({
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const [patientCount] = await ctx.db
      .select({ count: count() })
      .from(patients)
      .where(eq(patients.status, 'active'));

    const [followupCount] = await ctx.db
      .select({ count: count() })
      .from(followupTasks)
      .where(eq(followupTasks.status, 'pending'));

    const [exceptionCount] = await ctx.db
      .select({ count: count() })
      .from(exceptionOrders)
      .where(eq(exceptionOrders.status, 'open'));

    const [recordCount] = await ctx.db.select({ count: count() }).from(medicalRecords);

    return {
      activePatients: patientCount.count,
      pendingFollowups: followupCount.count,
      openExceptions: exceptionCount.count,
      totalRecords: recordCount.count
    };
  }),

  revisitRate: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string()
      })
    )
    .query(async ({ ctx, input }) => {
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);

      const totalVisitsResult = await ctx.db
        .select({ count: count() })
        .from(medicalRecords)
        .where(
          and(
            gte(medicalRecords.visitDate, start.toISOString().split('T')[0]),
            lte(medicalRecords.visitDate, end.toISOString().split('T')[0])
          )
        );

      const firstVisitPatients = await ctx.db
        .select({ patientId: medicalRecords.patientId })
        .from(medicalRecords)
        .where(
          and(
            gte(medicalRecords.visitDate, start.toISOString().split('T')[0]),
            lte(medicalRecords.visitDate, end.toISOString().split('T')[0])
          )
        )
        .groupBy(medicalRecords.patientId);

      const revisitPatients: string[] = [];
      for (const patient of firstVisitPatients) {
        const earlierVisits = await ctx.db
          .select({ count: count() })
          .from(medicalRecords)
          .where(
            and(
              eq(medicalRecords.patientId, patient.patientId),
              lte(medicalRecords.visitDate, start.toISOString().split('T')[0])
            )
          );
        if (earlierVisits[0].count > 0) {
          revisitPatients.push(patient.patientId);
        }
      }

      const totalPatients = firstVisitPatients.length;
      const revisitCount = revisitPatients.length;
      const revisitRate = totalPatients > 0 ? (revisitCount / totalPatients) * 100 : 0;

      return {
        totalPatients,
        revisitCount,
        revisitRate: Math.round(revisitRate * 100) / 100,
        totalVisits: totalVisitsResult[0].count,
        statisticalCaliber: `
统计口径说明：
1. 统计周期：${input.startDate} 至 ${input.endDate}
2. 复诊率定义：统计周期内有就诊记录且在此之前有过就诊记录的患者数 / 统计周期内有就诊记录的患者总数 × 100%
3. 就诊记录以病历表（medical_records）中的就诊日期（visit_date）为准
4. 仅统计状态为 active 的患者
        `
      };
    }),

  exportFollowups: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        status: z.enum(['pending', 'completed', 'missed', 'cancelled']).optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      const whereConditions = [
        gte(followupTasks.scheduledDate, start),
        lte(followupTasks.scheduledDate, end)
      ];

      if (input.status) {
        whereConditions.push(eq(followupTasks.status, input.status));
      }

      const items = await ctx.db
        .select()
        .from(followupTasks)
        .where(and(...whereConditions))
        .orderBy(desc(followupTasks.scheduledDate));

      const [exportLog] = await ctx.db
        .insert(exportLogs)
        .values({
          type: 'followup',
          title: `随访任务导出 - ${input.startDate} 至 ${input.endDate}`,
          description: `导出${input.status || '全部'}随访任务记录`,
          dataScope: {
            startDate: input.startDate,
            endDate: input.endDate,
            status: input.status || 'all'
          },
          statisticalCaliber: `
导出口径说明：
1. 导出范围：${input.startDate} 至 ${input.endDate} 期间的随访任务
2. 状态筛选：${input.status || '全部状态'}
3. 数据来源：followup_tasks 表
4. 导出时间：${new Date().toLocaleString()}
          `,
          exportedBy: ctx.user.id
        })
        .returning();

      return {
        items,
        exportLog,
        statisticalCaliber: exportLog.statisticalCaliber
      };
    }),

  exportExceptions: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        status: z.enum(['open', 'investigating', 'resolved', 'closed']).optional(),
        severity: z.enum(['low', 'medium', 'high', 'critical']).optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      const whereConditions = [
        gte(exceptionOrders.createdAt, start),
        lte(exceptionOrders.createdAt, end)
      ];

      if (input.status) {
        whereConditions.push(eq(exceptionOrders.status, input.status));
      }
      if (input.severity) {
        whereConditions.push(eq(exceptionOrders.severity, input.severity));
      }

      const items = await ctx.db
        .select()
        .from(exceptionOrders)
        .where(and(...whereConditions))
        .orderBy(desc(exceptionOrders.createdAt));

      const [exportLog] = await ctx.db
        .insert(exportLogs)
        .values({
          type: 'exception',
          title: `异常单导出 - ${input.startDate} 至 ${input.endDate}`,
          description: `导出异常单记录`,
          dataScope: {
            startDate: input.startDate,
            endDate: input.endDate,
            status: input.status || 'all',
            severity: input.severity || 'all'
          },
          statisticalCaliber: `
导出口径说明：
1. 导出范围：${input.startDate} 至 ${input.endDate} 期间创建的异常单
2. 状态筛选：${input.status || '全部状态'}
3. 严重程度：${input.severity || '全部级别'}
4. 数据来源：exception_orders 表
5. 导出时间：${new Date().toLocaleString()}
          `,
          exportedBy: ctx.user.id
        })
        .returning();

      return {
        items,
        exportLog,
        statisticalCaliber: exportLog.statisticalCaliber
      };
    }),

  exportLogs: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20)
      })
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(exportLogs);

      const items = await ctx.db
        .select()
        .from(exportLogs)
        .orderBy(desc(exportLogs.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      return {
        items,
        total: totalResult.count,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(totalResult.count / input.pageSize)
      };
    })
});
