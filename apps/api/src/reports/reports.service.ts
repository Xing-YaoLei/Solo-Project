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

    const avg = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const max = durations.length > 0 ? Math.max(...durations) : 0;
    const min = durations.length > 0 ? Math.min(...durations) : 0;

    return {
      total: closedComplaints.length,
      avgDurationMinutes: Math.round(avg),
      maxDurationMinutes: max,
      minDurationMinutes: min,
      byPriority: this.groupBy(closedComplaints, 'priority'),
    };
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
        dateMap[date] = { date, total: 0, statuses: {} as Record<string, number> };
      }
      dateMap[date].total++;
      dateMap[date].statuses[c.status] = (dateMap[date].statuses[c.status] || 0) + 1;
    }

    return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getOwnerDrill(departmentId?: string) {
    const where: any = { ownerId: { not: null } };
    if (departmentId) where.departmentId = departmentId;

    const complaints = await this.prisma.complaint.findMany({
      where,
      include: { owner: { select: { id: true, name: true, department: true } } },
    });

    const ownerMap: Record<string, any> = {};
    for (const c of complaints) {
      if (!c.owner) continue;
      const id = c.owner.id;
      if (!ownerMap[id]) {
        ownerMap[id] = {
          ownerId: id,
          ownerName: c.owner.name,
          department: c.owner.department,
          total: 0,
          closed: 0,
          processing: 0,
        };
      }
      ownerMap[id].total++;
      if (c.status === ComplaintStatus.CLOSED) ownerMap[id].closed++;
      else ownerMap[id].processing++;
    }

    return Object.values(ownerMap).sort((a, b) => b.total - a.total);
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

  private groupBy(arr: any[], key: string) {
    return arr.reduce((acc: Record<string, number>, item) => {
      const k = item[key];
      const durations = arr.filter((x) => x[key] === k).map((x) => x.closeDurationMinutes).filter(Boolean);
      const avg = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      acc[k] = Math.round(avg);
      return acc;
    }, {});
  }
}
