import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CleaningTaskStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async getMonthlyReport(year: number, month: number) {
    const cacheKey = `report:monthly:${year}-${month}`;
    const cached = await this.redisService.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [totalTasks, completedTasks, missedTasks] = await Promise.all([
      this.prisma.cleaningTask.count({
        where: { taskDate: { gte: startDate, lte: endDate } },
      }),
      this.prisma.cleaningTask.count({
        where: {
          taskDate: { gte: startDate, lte: endDate },
          status: CleaningTaskStatus.COMPLETED,
        },
      }),
      this.prisma.cleaningTask.count({
        where: {
          taskDate: { gte: startDate, lte: endDate },
          status: CleaningTaskStatus.MISSED,
        },
      }),
    ]);

    const onTimeTasks = await this.prisma.cleaningTask.count({
      where: {
        taskDate: { gte: startDate, lte: endDate },
        status: CleaningTaskStatus.COMPLETED,
        actualEnd: { not: null },
      },
    });

    const punctualityRate = totalTasks > 0 
      ? Math.round((onTimeTasks / totalTasks) * 10000) / 100 
      : 0;

    const tasksByProperty = await this.prisma.cleaningTask.groupBy({
      by: ['propertyId'],
      where: { taskDate: { gte: startDate, lte: endDate } },
      _count: true,
      orderBy: { _count: { propertyId: 'desc' } },
      take: 10,
    });

    const tasksByHousekeeper = await this.prisma.cleaningTask.groupBy({
      by: ['assignedToId'],
      where: {
        taskDate: { gte: startDate, lte: endDate },
        assignedToId: { not: null },
      },
      _count: true,
      orderBy: { _count: { assignedToId: 'desc' } },
    });

    const report = {
      year,
      month,
      totalTasks,
      completedTasks,
      missedTasks,
      onTimeTasks,
      punctualityRate,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 10000) / 100 : 0,
      tasksByProperty,
      tasksByHousekeeper,
      generatedAt: new Date().toISOString(),
    };

    await this.redisService.set(cacheKey, JSON.stringify(report), 3600);

    return report;
  }

  async getPunctualityRate(startDate: Date, endDate: Date) {
    const totalTasks = await this.prisma.cleaningTask.count({
      where: { taskDate: { gte: startDate, lte: endDate } },
    });

    const onTimeTasks = await this.prisma.cleaningTask.count({
      where: {
        taskDate: { gte: startDate, lte: endDate },
        status: CleaningTaskStatus.COMPLETED,
        actualEnd: { not: null },
      },
    });

    return {
      totalTasks,
      onTimeTasks,
      punctualityRate: totalTasks > 0 
        ? Math.round((onTimeTasks / totalTasks) * 10000) / 100 
        : 0,
    };
  }

  async exportMonthlyReport(
    year: number,
    month: number,
    filters: {
      propertyId?: string;
      assignedToId?: string;
      status?: CleaningTaskStatus;
    },
    operatorId: string,
    operatorName: string,
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const tasks = await this.prisma.cleaningTask.findMany({
      where: {
        taskDate: { gte: startDate, lte: endDate },
        propertyId: filters.propertyId,
        assignedToId: filters.assignedToId,
        status: filters.status,
      },
      include: {
        property: { select: { name: true, roomNumber: true } },
        assignedTo: { select: { name: true } },
        booking: { select: { guestName: true } },
      },
      orderBy: { taskDate: 'asc' },
    });

    const report = {
      reportType: 'monthly_cleaning_report',
      title: `${year}年${month}月保洁任务月报`,
      filters: {
        dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
        propertyId: filters.propertyId || '全部',
        assignedToId: filters.assignedToId || '全部',
        status: filters.status || '全部',
      },
      generatedAt: new Date().toISOString(),
      operator: { id: operatorId, name: operatorName },
      totalCount: tasks.length,
      data: tasks.map(task => ({
        id: task.id,
        propertyName: task.property?.name,
        roomNumber: task.property?.roomNumber,
        guestName: task.booking?.guestName,
        housekeeper: task.assignedTo?.name,
        taskDate: task.taskDate,
        scheduledStart: task.scheduledStart,
        scheduledEnd: task.scheduledEnd,
        actualStart: task.actualStart,
        actualEnd: task.actualEnd,
        status: task.status,
        priority: task.priority,
        notes: task.notes,
      })),
    };

    return report;
  }
}
