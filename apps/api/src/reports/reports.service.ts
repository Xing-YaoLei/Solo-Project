import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ComplaintStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getCloseDuration(startDate?: string, endDate?: string) {
    const where: any = { status: ComplaintStatus.CLOSED };
    if (startDate) where.closedAt = { ...where.closedAt, gte: new Date(startDate) };
    if (endDate) where.closedAt = { ...where.closedAt, lte: new Date(endDate) };

    const closedComplaints = await this.prisma.complaint.findMany({
      where,
      select: { closeDurationMinutes: true, priority: true, departmentId: true },
    });

    const durations = closedComplaints
      .map((c) => c.closeDurationMinutes)
      .filter((d): d is number => d !== null);

    const ranges = [
      { label: '<30分钟', min: 0, max: 30 },
      { label: '30分钟-2小时', min: 30, max: 120 },
      { label: '2小时-8小时', min: 120, max: 480 },
      { label: '8小时-24小时', min: 480, max: 1440 },
      { label: '>24小时', min: 1440, max: Infinity },
    ];

    return ranges.map(({ label, min, max }) => {
      const inRange = durations.filter((d) => d >= min && d < max);
      const avgMinutes = inRange.length > 0
        ? Math.round(inRange.reduce((a, b) => a + b, 0) / inRange.length)
        : 0;
      return {
        range: label,
        count: inRange.length,
        avgMinutes,
      };
    });
  }

  async getDateTrend(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

    const complaints = await this.prisma.complaint.findMany({
      where,
      select: { createdAt: true, status: true },
    });

    const dateMap: Record<string, any> = {};
    for (const c of complaints) {
      const date = c.createdAt.toISOString().split('T')[0];
      if (!dateMap[date]) {
        dateMap[date] = { date, total: 0, resolved: 0, overdue: 0 };
      }
      dateMap[date].total++;
      if (c.status === ComplaintStatus.CLOSED || c.status === ComplaintStatus.VISITING) {
        dateMap[date].resolved++;
      }
      if (c.status === ComplaintStatus.OVERDUE) {
        dateMap[date].overdue++;
      }
    }

    return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getOwnerDrill(departmentId?: string) {
    const where: any = { ownerId: { not: null } };
    if (departmentId) where.departmentId = departmentId;

    const complaints = await this.prisma.complaint.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true } },
        visitResult: { select: { satisfaction: true } },
      },
    });

    const ownerMap: Record<string, any> = {};
    for (const c of complaints) {
      if (!c.owner) continue;
      const id = c.owner.id;
      if (!ownerMap[id]) {
        ownerMap[id] = {
          ownerId: id,
          ownerName: c.owner.name,
          totalCount: 0,
          closedCount: 0,
          durations: [] as number[],
          satisfactions: [] as number[],
          overdueCount: 0,
        };
      }
      ownerMap[id].totalCount++;
      if (c.status === ComplaintStatus.CLOSED) {
        ownerMap[id].closedCount++;
        if (c.closeDurationMinutes != null) {
          ownerMap[id].durations.push(c.closeDurationMinutes);
        }
        if (c.visitResult?.satisfaction != null) {
          ownerMap[id].satisfactions.push(c.visitResult.satisfaction);
        }
      }
      if (c.status === ComplaintStatus.OVERDUE) {
        ownerMap[id].overdueCount++;
      }
    }

    return Object.values(ownerMap)
      .map((o) => {
        const avgDurationMinutes = o.durations.length > 0
          ? Math.round(o.durations.reduce((a: number, b: number) => a + b, 0) / o.durations.length)
          : 0;
        const avgSatisfaction = o.satisfactions.length > 0
          ? Math.round(
              (o.satisfactions.reduce((a: number, b: number) => a + b, 0) / o.satisfactions.length) * 10
            ) / 10
          : 0;
        return {
          ownerId: o.ownerId,
          ownerName: o.ownerName,
          totalCount: o.totalCount,
          closedCount: o.closedCount,
          avgDurationMinutes,
          avgSatisfaction,
          overdueCount: o.overdueCount,
        };
      })
      .sort((a, b) => b.totalCount - a.totalCount);
  }

  async export(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

    const complaints = await this.prisma.complaint.findMany({
      where,
      include: {
        owner: { select: { name: true } },
        department: { select: { name: true } },
        tags: { select: { name: true } },
        visitResult: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return complaints.map((c) => ({
      '工单编号': c.code,
      '标题': c.title,
      '来源': c.source,
      '状态': c.status,
      '优先级': c.priority,
      '游客姓名': c.visitorName,
      '游客电话': c.visitorPhone,
      '位置': c.location || '',
      '处理人': c.owner?.name || '',
      '部门': c.department?.name || '',
      '标签': c.tags.map((t) => t.name).join(','),
      '创建时间': c.createdAt.toISOString(),
      '截止时间': c.deadlineAt.toISOString(),
      '关闭时间': c.closedAt?.toISOString() || '',
      '处理时长(分钟)': c.closeDurationMinutes || '',
      '满意度': c.visitResult?.satisfaction || '',
      '回访反馈': c.visitResult?.feedback || '',
    }));
  }
}
