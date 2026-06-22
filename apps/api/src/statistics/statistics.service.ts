import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  TaskStatus,
  TaskPriority,
  EvidenceStatus,
  EvidenceCategory,
  IssueSeverity,
  IssueStatus,
  AuditType,
  ReviewResult,
  UserRole,
} from '@prisma/client';

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [
      totalTasks,
      totalEvidences,
      totalIssues,
      totalUsers,
      pendingTasks,
      inProgressTasks,
      approvedTasks,
      submittedEvidences,
      approvedEvidences,
      openIssues,
      recurredIssues,
      newThisWeek,
    ] = await Promise.all([
        this.prisma.auditTask.count(),
        this.prisma.evidence.count(),
        this.prisma.issue.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.auditTask.count({ where: { status: TaskStatus.PENDING } }),
        this.prisma.auditTask.count({ where: { status: TaskStatus.IN_PROGRESS } }),
        this.prisma.auditTask.count({ where: { status: TaskStatus.APPROVED } }),
        this.prisma.evidence.count({ where: { status: EvidenceStatus.SUBMITTED } }),
        this.prisma.evidence.count({ where: { status: EvidenceStatus.APPROVED } }),
        this.prisma.issue.count({ where: { status: { in: [IssueStatus.IDENTIFIED, IssueStatus.MITIGATING] } } }),
        this.prisma.issue.count({ where: { isRecurred: true } }),
        this.getWeeklyNewCounts(),
      ]
    );

    return {
      summary: {
        totalTasks,
        totalEvidences,
        totalIssues,
        totalUsers,
        taskCompletionRate: totalTasks > 0 ? ((approvedTasks / totalTasks) * 100).toFixed(1) : '0',
        evidenceApprovalRate: totalEvidences > 0 ? ((approvedEvidences / totalEvidences) * 100).toFixed(1) : '0',
      },
      taskStatus: {
        pending: pendingTasks,
        inProgress: inProgressTasks,
        approved: approvedTasks,
      },
      evidenceStatus: {
        submitted: submittedEvidences,
        approved: approvedEvidences,
      },
      issues: {
        open: openIssues,
        recurred: recurredIssues,
      },
      weekly: newThisWeek,
    };
  }

  private async getWeeklyNewCounts() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [tasks, evidences, issues] = await Promise.all([
      this.prisma.auditTask.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.evidence.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.issue.count({ where: { createdAt: { gte: weekAgo } } }),
    ]);

    return { tasks, evidences, issues };
  }

  async getTaskStats(filters?: { department?: string; startDate?: string; endDate?: string; auditType?: AuditType }) {
    const where: any = {};
    if (filters?.department) where.department = filters.department;
    if (filters?.auditType) where.auditType = filters.auditType;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [total, byStatus, byPriority, byAuditType, byDepartment, overdue] = await Promise.all([
      this.prisma.auditTask.count({ where }),
      this.prisma.auditTask.groupBy({ by: ['status'], _count: { status: true }, where }),
      this.prisma.auditTask.groupBy({ by: ['priority'], _count: { priority: true }, where }),
      this.prisma.auditTask.groupBy({ by: ['auditType'], _count: { auditType: true }, where }),
      this.prisma.auditTask.groupBy({ by: ['department'], _count: { department: true }, where: { ...where, department: { not: null } } }),
      this.prisma.auditTask.count({
        where: {
          ...where,
          status: { notIn: [TaskStatus.APPROVED, TaskStatus.ARCHIVED] },
          dueDate: { lt: new Date(), not: null },
        },
      }),
    ]);

    return {
      total,
      overdue,
      byStatus: byStatus.map((g) => ({ status: g.status, count: g._count.status })),
      byPriority: byPriority.map((g) => ({ priority: g.priority, count: g._count.priority })),
      byAuditType: byAuditType.map((g) => ({ auditType: g.auditType, count: g._count.auditType })),
      byDepartment: byDepartment
        .filter((g) => g.department)
        .map((g) => ({ department: g.department, count: g._count.department })),
      completionRate: total > 0 ? ((byStatus.find((s) => s.status === TaskStatus.APPROVED)?._count.status || 0) / total) * 100 : 0,
    };
  }

  async getEvidenceStats(filters?: { category?: EvidenceCategory; taskId?: string; startDate?: string; endDate?: string }) {
    const where: any = {};
    if (filters?.category) where.category = filters.category;
    if (filters?.taskId) where.taskId = filters.taskId;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [total, byStatus, byCategory, withSupplement] = await Promise.all([
      this.prisma.evidence.count({ where }),
      this.prisma.evidence.groupBy({ by: ['status'], _count: { status: true }, where }),
      this.prisma.evidence.groupBy({ by: ['category'], _count: { category: true }, where }),
      this.prisma.evidence.count({
        where: {
          ...where,
          supplementHistory: { some: {} },
        },
      }),
    ]);

    return {
      total,
      withSupplement,
      byStatus: byStatus.map((g) => ({ status: g.status, count: g._count.status })),
      byCategory: byCategory.map((g) => ({ category: g.category, count: g._count.category })),
      approvalRate: total > 0 ? ((byStatus.find((s) => s.status === EvidenceStatus.APPROVED)?._count.status || 0) / total) * 100 : 0,
    };
  }

  async getIssueStats(filters?: { category?: string; department?: string; severity?: IssueSeverity; startDate?: string; endDate?: string }) {
    const where: any = {};
    if (filters?.category) where.category = filters.category;
    if (filters?.department) where.department = filters.department;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.startDate || filters?.endDate) {
      where.identifiedAt = {};
      if (filters.startDate) where.identifiedAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.identifiedAt.lte = new Date(filters.endDate);
    }

    const [total, byStatus, bySeverity, byCategory, recurred, recurrenceDetails] = await Promise.all([
      this.prisma.issue.count({ where }),
      this.prisma.issue.groupBy({ by: ['status'], _count: { status: true }, where }),
      this.prisma.issue.groupBy({ by: ['severity'], _count: { severity: true }, where }),
      this.prisma.issue.groupBy({ by: ['category'], _count: { category: true }, where: { ...where, category: { not: null } } }),
      this.prisma.issue.count({ where: { ...where, isRecurred: true } }),
      this.getRecurrenceStats(where),
    ]);

    return {
      total,
      recurred,
      recurrenceRate: total > 0 ? ((recurred / total) * 100).toFixed(2) : '0',
      byStatus: byStatus.map((g) => ({ status: g.status, count: g._count.status })),
      bySeverity: bySeverity.map((g) => ({ severity: g.severity, count: g._count.severity })),
      byCategory: byCategory
        .filter((g) => g.category)
        .map((g) => ({ category: g.category, count: g._count.category })),
      recurrenceDetails,
    };
  }

  private async getRecurrenceStats(where: any) {
    const recurredIssues = await this.prisma.issue.findMany({
      where: { ...where, isRecurred: true },
      select: {
        id: true,
        issueNo: true,
        title: true,
        recurrenceCount: true,
        severity: true,
        category: true,
        identifiedAt: true,
        parentIssue: { select: { id: true, issueNo: true, title: true } },
      },
      orderBy: { recurrenceCount: 'desc' },
      take: 20,
    });

    const totalRecurrences = recurredIssues.reduce((sum, i) => sum + i.recurrenceCount, 0);

    return {
      topRecurred: recurredIssues,
      totalRecurrenceCount: totalRecurrences,
      averageRecurrence: recurredIssues.length > 0 ? totalRecurrences / recurredIssues.length : 0,
    };
  }

  async getRecurrenceTrend(months: number = 6) {
    const results = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const [total, recurred] = await Promise.all([
        this.prisma.issue.count({
          where: {
            identifiedAt: { gte: monthStart, lte: monthEnd },
          },
        }),
        this.prisma.issue.count({
          where: {
            identifiedAt: { gte: monthStart, lte: monthEnd },
            isRecurred: true,
          },
        }),
      ]);

      results.push({
        month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
        total,
        recurred,
        rate: total > 0 ? ((recurred / total) * 100).toFixed(2) : '0',
      });
    }

    return results;
  }

  async getUserStats() {
    const [total, byRole, activeTaskAssignees] = await Promise.all([
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.groupBy({ by: ['role'], _count: { role: true }, where: { isActive: true } }),
      this.prisma.auditTask.groupBy({
        by: ['assignedToId'],
        _count: { assignedToId: true },
        where: { assignedToId: { not: null }, status: { notIn: [TaskStatus.APPROVED, TaskStatus.ARCHIVED] } },
        orderBy: { _count: { assignedToId: 'desc' } },
        take: 10,
      }),
    ]);

    const assigneeWithNames = await Promise.all(
      activeTaskAssignees
        .filter((g) => g.assignedToId)
        .map(async (g) => {
          const user = await this.prisma.user.findUnique({
            where: { id: g.assignedToId as string },
            select: { id: true, fullName: true, role: true },
          });
          return { user, taskCount: g._count.assignedToId };
        }),
    );

    return {
      total,
      byRole: byRole.map((g) => ({ role: g.role, count: g._count.role })),
      topTaskAssignees: assigneeWithNames.filter((item) => item.user),
    };
  }

  async drillDown(
    dimension: string,
    value: string,
    filters?: { startDate?: string; endDate?: string },
  ) {
    const dateFilter: any = {};
    if (filters?.startDate) dateFilter.gte = new Date(filters.startDate);
    if (filters?.endDate) dateFilter.lte = new Date(filters.endDate);

    const data: any = { dimension, value, filters };

    switch (dimension) {
      case 'task_status':
        data.tasks = await this.prisma.auditTask.findMany({
          where: {
            status: value as TaskStatus,
            ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
          },
          take: 100,
          select: {
            id: true,
            taskNo: true,
            title: true,
            priority: true,
            dueDate: true,
            assignedTo: { select: { fullName: true } },
            department: true,
          },
        });
        break;
      case 'task_department':
        data.tasks = await this.prisma.auditTask.findMany({
          where: { department: value, ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}) },
          take: 100,
          select: {
            id: true, taskNo: true, title: true, status: true,
            priority: true, dueDate: true, assignedTo: { select: { fullName: true } },
          },
        });
        break;
      case 'issue_severity':
        data.issues = await this.prisma.issue.findMany({
          where: { severity: value as IssueSeverity, ...(Object.keys(dateFilter).length ? { identifiedAt: dateFilter } : {}) },
          take: 100,
          select: {
            id: true, issueNo: true, title: true, status: true,
            category: true, identifiedAt: true, recurrenceCount: true,
          },
        });
        break;
      case 'issue_category':
        data.issues = await this.prisma.issue.findMany({
          where: { category: value, ...(Object.keys(dateFilter).length ? { identifiedAt: dateFilter } : {}) },
          take: 100,
          select: {
            id: true, issueNo: true, title: true, status: true,
            severity: true, identifiedAt: true, isRecurred: true,
          },
        });
        break;
      case 'evidence_category':
        data.evidences = await this.prisma.evidence.findMany({
          where: { category: value as EvidenceCategory, ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}) },
          take: 100,
          select: {
            id: true, evidenceNo: true, title: true, status: true,
            submittedAt: true, submittedBy: { select: { fullName: true } },
            task: { select: { taskNo: true, title: true } },
          },
        });
        break;
      case 'issue_recurred':
        data.issues = await this.prisma.issue.findMany({
          where: { isRecurred: true, ...(Object.keys(dateFilter).length ? { identifiedAt: dateFilter } : {}) },
          take: 100,
          include: {
            parentIssue: { select: { id: true, issueNo: true, title: true } },
          },
          orderBy: { recurrenceCount: 'desc' },
        });
        break;
      default:
        throw new Error(`不支持的穿透查询维度: ${dimension}`);
    }

    return data;
  }

  async getReviewStats(filters?: { startDate?: string; endDate?: string }) {
    const where: any = {};
    if (filters?.startDate || filters?.endDate) {
      where.reviewedAt = {};
      if (filters.startDate) where.reviewedAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.reviewedAt.lte = new Date(filters.endDate);
    }

    const [total, byResult, byReviewer, byTargetType, avgRounds] = await Promise.all([
      this.prisma.reviewRecord.count({ where }),
      this.prisma.reviewRecord.groupBy({ by: ['result'], _count: { result: true }, where }),
      this.prisma.reviewRecord.groupBy({ by: ['reviewerId'], _count: { reviewerId: true }, where, orderBy: { _count: { reviewerId: 'desc' } }, take: 10 }),
      this.prisma.reviewRecord.groupBy({ by: ['targetType'], _count: { targetType: true }, where }),
      this.prisma.reviewRecord.aggregate({
        _avg: { reviewRound: true },
        where,
      }),
    ]);

    const reviewersWithNames = await Promise.all(
      byReviewer.map(async (g) => {
        const user = await this.prisma.user.findUnique({
          where: { id: g.reviewerId },
          select: { fullName: true, role: true },
        });
        return {
          reviewer: user,
          total: g._count.reviewerId,
          approved: await this.prisma.reviewRecord.count({
            where: { ...where, reviewerId: g.reviewerId, result: ReviewResult.APPROVED },
          }),
        };
      }),
    );

    return {
      total,
      avgRounds: avgRounds._avg.reviewRound?.toFixed(2) || '0',
      byResult: byResult.map((g) => ({ result: g.result, count: g._count.result })),
      byTargetType: byTargetType.map((g) => ({ targetType: g.targetType, count: g._count.targetType })),
      topReviewers: reviewersWithNames,
    };
  }
}
