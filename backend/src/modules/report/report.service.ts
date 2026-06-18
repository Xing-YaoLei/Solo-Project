import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ReportQueryDto } from './dto/report.dto';
import { TaskStatus, UserRole } from '@prisma/client';
import * as dayjs from 'dayjs';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async getTaskStats(query: ReportQueryDto, currentUser: any) {
    const where = await this.buildWhere(query, currentUser);

    const tasks = await this.prisma.confirmationTask.findMany({
      where,
      select: {
        id: true,
        status: true,
        type: true,
        createdAt: true,
        confirmedAt: true,
        amount: true,
      },
    });

    const statusStats: Record<string, number> = {};
    const typeStats: Record<string, number> = {};

    tasks.forEach((task) => {
      statusStats[task.status] = (statusStats[task.status] || 0) + 1;
      typeStats[task.type] = (typeStats[task.type] || 0) + 1;
    });

    const totalAmount = tasks
      .filter((t) => t.amount)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const pendingAmount = tasks
      .filter((t) => t.status === TaskStatus.PENDING && t.amount)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const approvedAmount = tasks
      .filter((t) => t.status === TaskStatus.APPROVED && t.amount)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      total: tasks.length,
      statusStats,
      typeStats,
      amountStats: {
        totalAmount,
        pendingAmount,
        approvedAmount,
      },
    };
  }

  async getConfirmationTimeReport(query: ReportQueryDto, currentUser: any) {
    const where = await this.buildWhere(query, currentUser);
    where.confirmedAt = { not: null };

    const tasks = await this.prisma.confirmationTask.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        confirmedAt: true,
        type: true,
      },
    });

    const confirmationTimes = tasks.map((task) => {
      const hours = dayjs(task.confirmedAt).diff(dayjs(task.createdAt), 'hour', true);
      return { taskId: task.id, hours, type: task.type };
    });

    if (confirmationTimes.length === 0) {
      return {
        avgHours: 0,
        minHours: 0,
        maxHours: 0,
        medianHours: 0,
        total: 0,
        byType: {},
      };
    }

    const hours = confirmationTimes.map((t) => t.hours).sort((a, b) => a - b);
    const avgHours = hours.reduce((a, b) => a + b, 0) / hours.length;
    const minHours = hours[0];
    const maxHours = hours[hours.length - 1];
    const medianHours = hours[Math.floor(hours.length / 2)];

    const byType: Record<string, { avg: number; count: number }> = {};
    confirmationTimes.forEach((t) => {
      if (!byType[t.type]) {
        byType[t.type] = { avg: 0, count: 0 };
      }
      byType[t.type].count++;
      byType[t.type].avg = (byType[t.type].avg * (byType[t.type].count - 1) + t.hours) / byType[t.type].count;
    });

    return {
      avgHours: Number(avgHours.toFixed(2)),
      minHours: Number(minHours.toFixed(2)),
      maxHours: Number(maxHours.toFixed(2)),
      medianHours: Number(medianHours.toFixed(2)),
      total: tasks.length,
      byType,
    };
  }

  async getUnconfirmedAmountReport(query: ReportQueryDto, currentUser: any) {
    const where = await this.buildWhere(query, currentUser);
    where.status = {
      in: [TaskStatus.PENDING, TaskStatus.DISPUTED, TaskStatus.OVERDUE],
    };
    where.amount = { not: null };

    const tasks = await this.prisma.confirmationTask.findMany({
      where,
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
      },
    });

    const byType: Record<string, { taskCount: number; totalAmount: number }> = {};

    tasks.forEach((task) => {
      if (!byType[task.type]) {
        byType[task.type] = { taskCount: 0, totalAmount: 0 };
      }
      byType[task.type].taskCount++;
      byType[task.type].totalAmount += Number(task.amount);
    });

    const totalTaskCount = tasks.length;
    const totalAmount = tasks.reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      byType,
      totalTaskCount,
      totalAmount,
    };
  }

  async getReworkReasonReport(query: ReportQueryDto, currentUser: any) {
    const where = await this.buildWhere(query, currentUser);
    where.status = TaskStatus.REJECTED;

    const tasks = await this.prisma.confirmationTask.findMany({
      where,
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    const reasonCounts: Record<string, number> = {};
    let totalRejected = 0;

    tasks.forEach((task) => {
      const latestVersion = task.versions[0];
      if (latestVersion?.changeReason) {
        const reason = latestVersion.changeReason;
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
        totalRejected++;
      }
    });

    const reasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: totalRejected > 0 ? Number(((count / totalRejected) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      reasons,
      totalRejected,
    };
  }

  async getProjectStats(query: ReportQueryDto, currentUser: any) {
    const where: any = {};

    if (query.startDate) {
      where.createdAt = { gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(query.endDate) };
    }

    if (currentUser.role === UserRole.OWNER) {
      where.ownerId = currentUser.id;
    } else if (currentUser.role === UserRole.PROJECT_MANAGER) {
      where.projectManagerId = currentUser.id;
    }

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
            amount: true,
          },
        },
      },
    });

    const projectStats = projects.map((project) => {
      const taskStats: Record<string, number> = {};
      let totalAmount = 0;
      let confirmedAmount = 0;

      project.tasks.forEach((task) => {
        taskStats[task.status] = (taskStats[task.status] || 0) + 1;
        if (task.amount) {
          totalAmount += Number(task.amount);
          if (task.status === TaskStatus.APPROVED) {
            confirmedAmount += Number(task.amount);
          }
        }
      });

      return {
        projectId: project.id,
        projectName: project.name,
        totalTasks: project.tasks.length,
        taskStats,
        totalAmount,
        confirmedAmount,
        confirmationRate: project.tasks.length > 0
          ? Number((((taskStats[TaskStatus.APPROVED] || 0) / project.tasks.length) * 100).toFixed(2))
          : 0,
      };
    });

    return {
      totalProjects: projects.length,
      projectStats,
    };
  }

  async getDashboardStats(currentUser: any) {
    const today = dayjs().startOf('day').toDate();
    const last30Days = dayjs().subtract(30, 'day').toDate();

    const taskWhere: any = { createdAt: { gte: last30Days } };

    if (currentUser.role === UserRole.OWNER) {
      const projects = await this.prisma.project.findMany({
        where: { ownerId: currentUser.id },
        select: { id: true },
      });
      taskWhere.projectId = { in: projects.map((p) => p.id) };
    } else if (currentUser.role === UserRole.FOREMAN || currentUser.role === UserRole.DESIGNER) {
      taskWhere.createdById = currentUser.id;
    } else if (currentUser.role === UserRole.PROJECT_MANAGER) {
      const projects = await this.prisma.project.findMany({
        where: { projectManagerId: currentUser.id },
        select: { id: true },
      });
      taskWhere.projectId = { in: projects.map((p) => p.id) };
    }

    const [allTasks, projectsCount] = await Promise.all([
      this.prisma.confirmationTask.findMany({
        where: taskWhere,
        select: {
          id: true,
          status: true,
          amount: true,
          createdAt: true,
          type: true,
        },
      }),
      this.prisma.project.count({
        where: currentUser.role === UserRole.OWNER
          ? { ownerId: currentUser.id }
          : currentUser.role === UserRole.PROJECT_MANAGER
          ? { projectManagerId: currentUser.id }
          : {},
      }),
    ]);

    const stats = {
      totalTasks: allTasks.length,
      pendingTasks: allTasks.filter((t) => t.status === TaskStatus.PENDING).length,
      approvedTasks: allTasks.filter((t) => t.status === TaskStatus.APPROVED).length,
      rejectedTasks: allTasks.filter((t) => t.status === TaskStatus.REJECTED).length,
      disputedTasks: allTasks.filter((t) => t.status === TaskStatus.DISPUTED).length,
      overdueTasks: allTasks.filter((t) => t.status === TaskStatus.OVERDUE).length,
      totalProjects: projectsCount,
      totalAmount: allTasks.filter((t) => t.amount).reduce((sum, t) => sum + Number(t.amount), 0),
      approvedAmount: allTasks
        .filter((t) => t.status === TaskStatus.APPROVED && t.amount)
        .reduce((sum, t) => sum + Number(t.amount), 0),
      pendingAmount: allTasks
        .filter((t) => (t.status === TaskStatus.PENDING || t.status === TaskStatus.OVERDUE) && t.amount)
        .reduce((sum, t) => sum + Number(t.amount), 0),
      todayTasks: allTasks.filter((t) => t.createdAt >= today).length,
    };

    return stats;
  }

  private async buildWhere(query: ReportQueryDto, currentUser: any) {
    const where: any = {};

    if (query.startDate) {
      where.createdAt = { gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(query.endDate) };
    }

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.taskType) {
      where.type = query.taskType;
    }

    if (currentUser.role === UserRole.OWNER) {
      const projects = await this.prisma.project.findMany({
        where: { ownerId: currentUser.id },
        select: { id: true },
      });
      where.projectId = { in: projects.map((p) => p.id) };
    } else if (currentUser.role === UserRole.PROJECT_MANAGER) {
      const projects = await this.prisma.project.findMany({
        where: { projectManagerId: currentUser.id },
        select: { id: true },
      });
      where.projectId = { in: projects.map((p) => p.id) };
    } else if (currentUser.role === UserRole.FOREMAN || currentUser.role === UserRole.DESIGNER) {
      where.createdById = currentUser.id;
    }

    return where;
  }
}
