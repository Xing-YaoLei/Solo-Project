import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, createRoleMiddleware } from '../trpc';
import type { DashboardStats } from '../../../shared/types';
import {
  mockElders,
  mockAssessments,
  mockIncidents,
  mockCareLevels,
  mockMedicationExecutions
} from '../mockData';

function toDate(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  return date instanceof Date ? date : new Date(date);
}

const adminOrSupervisor = createRoleMiddleware('admin', 'supervisor');

export const analyticsRouter = createTRPCRouter({
  dashboard: protectedProcedure.query((): DashboardStats => {
    const totalElders = mockElders.length;
    const admittedElders = mockElders.filter((e) => e.status === 'admitted').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAssessments = mockAssessments.filter(
      (a) => {
        const d = toDate(a.createdAt)!;
        return d >= today && d < tomorrow;
      }
    ).length;

    const activeIncidents = mockIncidents.filter(
      (i) => i.status !== 'closed'
    ).length;

    const totalExecutions = mockMedicationExecutions.length;
    const normalExecutions = mockMedicationExecutions.filter((e) => !e.isAbnormal).length;
    const complianceRate = totalExecutions > 0
      ? Math.round((normalExecutions / totalExecutions) * 100)
      : 100;

    const careLevelDistribution = mockCareLevels.map((cl) => ({
      level: cl.name,
      count: mockElders.filter((e) => e.careLevelId === cl.id).length
    }));

    return {
      totalElders,
      admittedElders,
      todayAssessments,
      activeIncidents,
      complianceRate,
      careLevelDistribution
    };
  }),

  careLevelDistribution: protectedProcedure.query(() => {
    return mockCareLevels.map((cl) => ({
      id: cl.id,
      level: cl.name,
      count: mockElders.filter((e) => e.careLevelId === cl.id).length,
      percentage: mockElders.length > 0
        ? Math.round((mockElders.filter((e) => e.careLevelId === cl.id).length / mockElders.length) * 100)
        : 0
    }));
  }),

  incidentStatistics: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30)
      })
    )
    .query(({ input }) => {
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - input.days);

      const filtered = mockIncidents.filter((i) => i.reportedAt >= startDate);

      const byType: Record<string, number> = {
        fall: 0,
        other: 0
      };
      const byStatus: Record<string, number> = {
        reported: 0,
        supplementing: 0,
        confirming: 0,
        closed: 0
      };

      for (const incident of filtered) {
        byType[incident.type] = (byType[incident.type] ?? 0) + 1;
        byStatus[incident.status] = (byStatus[incident.status] ?? 0) + 1;
      }

      const dailyData: { date: string; count: number }[] = [];
      for (let d = 0; d < input.days; d++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + d);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const count = mockIncidents.filter(
          (i) => {
            const d = toDate(i.reportedAt)!;
            return d >= date && d < nextDay;
          }
        ).length;

        dailyData.push({
          date: date.toISOString().slice(0, 10),
          count
        });
      }

      return {
        total: filtered.length,
        byType,
        byStatus,
        dailyData
      };
    }),

  complianceRate: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30)
      })
    )
    .query(({ input }) => {
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - input.days);

      const filtered = mockMedicationExecutions.filter(
        (e) => {
          const d = toDate(e.executedAt)!;
          return d >= startDate;
        }
      );

      const total = filtered.length;
      const normal = filtered.filter((e) => !e.isAbnormal).length;
      const abnormal = total - normal;

      const dailyData: { date: string; rate: number; total: number; normal: number }[] = [];
      for (let d = 0; d < input.days; d++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + d);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const dayExecutions = mockMedicationExecutions.filter(
          (e) => {
            const d = toDate(e.executedAt)!;
            return d >= date && d < nextDay;
          }
        );
        const dayTotal = dayExecutions.length;
        const dayNormal = dayExecutions.filter((e) => !e.isAbnormal).length;

        dailyData.push({
          date: date.toISOString().slice(0, 10),
          rate: dayTotal > 0 ? Math.round((dayNormal / dayTotal) * 100) : 100,
          total: dayTotal,
          normal: dayNormal
        });
      }

      return {
        period: input.days,
        total,
        normal,
        abnormal,
        rate: total > 0 ? Math.round((normal / total) * 100) : 100,
        dailyData
      };
    }),

  assessmentEfficiency: protectedProcedure
    .use(adminOrSupervisor)
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30)
      })
    )
    .query(({ input }) => {
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - input.days);

      const filtered = mockAssessments.filter((a) => a.createdAt >= startDate);

      const byStatus: Record<string, number> = {
        draft: 0,
        collecting: 0,
        evaluating: 0,
        approving: 0,
        archived: 0,
        closed: 0
      };

      for (const a of filtered) {
        byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
      }

      const completed = filtered.filter(
        (a) => a.status === 'archived' || a.status === 'closed'
      ).length;

      return {
        total: filtered.length,
        completed,
        byStatus,
        completionRate: filtered.length > 0
          ? Math.round((completed / filtered.length) * 100)
          : 0
      };
    }),

  exportData: protectedProcedure
    .use(adminOrSupervisor)
    .input(
      z.object({
        type: z.enum(['elders', 'assessments', 'incidents', 'medications']),
        format: z.enum(['xlsx', 'csv']).default('xlsx'),
        filters: z.record(z.unknown()).optional()
      })
    )
    .query(({ input }) => {
      let data: unknown[] = [];
      let filename = '';

      switch (input.type) {
        case 'elders':
          data = mockElders.map((e) => ({
            姓名: e.name,
            性别: e.gender === 'male' ? '男' : '女',
            出生日期: toDate(e.birthDate)!.toISOString().slice(0, 10),
            身份证号: e.idCard,
            房间号: e.roomNumber,
            入住日期: toDate(e.admissionDate)?.toISOString().slice(0, 10) ?? '',
            状态: e.status === 'pending' ? '待入住' : e.status === 'admitted' ? '已入住' : '已出院',
            护理等级: e.careLevel?.name ?? '未评定'
          }));
          filename = `老人档案_${new Date().toISOString().slice(0, 10)}.${input.format}`;
          break;
        case 'assessments':
          data = mockAssessments.map((a) => ({
            老人姓名: a.elder?.name ?? '',
            状态: a.status,
            ADL评分: a.adlScore,
            认知评分: a.cognitionScore,
            情绪评分: a.emotionScore,
            社会支持评分: a.socialScore,
            总分: a.totalScore,
            建议等级: a.suggestedLevel?.name ?? '',
            最终等级: a.finalLevel?.name ?? '',
            创建时间: toDate(a.createdAt)!.toISOString()
          }));
          filename = `评估记录_${new Date().toISOString().slice(0, 10)}.${input.format}`;
          break;
        case 'incidents':
          data = mockIncidents.map((i) => ({
            老人姓名: i.elder?.name ?? '',
            类型: i.type === 'fall' ? '跌倒' : '其他',
            状态: i.status,
            上报人: i.reportedBy,
            地点: i.location,
            描述: i.description,
            上报时间: toDate(i.reportedAt)!.toISOString(),
            关闭时间: toDate(i.closedAt)?.toISOString() ?? ''
          }));
          filename = `事件记录_${new Date().toISOString().slice(0, 10)}.${input.format}`;
          break;
        case 'medications':
          data = mockMedicationExecutions.map((m) => ({
            执行时间: toDate(m.executedAt)!.toISOString(),
            执行人: m.executedBy,
            是否异常: m.isAbnormal ? '是' : '否',
            异常备注: m.abnormalNote ?? ''
          }));
          filename = `用药执行_${new Date().toISOString().slice(0, 10)}.${input.format}`;
          break;
      }

      return {
        success: true,
        filename,
        format: input.format,
        data,
        totalRows: data.length,
        downloadUrl: `/exports/${filename}`
      };
    })
});
