import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogService } from '../system-log/system-log.service';

@Injectable()
export class PerformanceService {
  constructor(
    private prisma: PrismaService,
    private systemLogService: SystemLogService,
  ) {}

  async findAll(params?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { status, startDate, endDate, search, page = 1, pageSize = 20 } = params || {};
    const where: any = {};

    if (status) where.status = status;
    if (startDate) where.startTime = { gte: startDate };
    if (endDate) {
      if (where.startTime) {
        where.startTime.lte = endDate;
      } else {
        where.startTime = { lte: endDate };
      }
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { venue: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.performanceSchedule.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { startTime: 'asc' },
        include: {
          ticketTypes: true,
          sponsors: true,
          _count: {
            select: { tasks: true, orders: true },
          },
        },
      }),
      this.prisma.performanceSchedule.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async findById(id: number) {
    return this.prisma.performanceSchedule.findUnique({
      where: { id },
      include: {
        ticketTypes: true,
        sponsors: true,
        tasks: {
          include: { assignee: true, creator: true },
          orderBy: { priority: 'asc' },
        },
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async create(data: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    venue: string;
    capacity: number;
    status?: string;
  }, operatorId?: number) {
    const schedule = await this.prisma.performanceSchedule.create({ data });
    
    await this.systemLogService.create({
      action: 'CREATE',
      module: 'performance',
      description: `创建演出排期: ${schedule.title}`,
      operatorId,
      relatedId: schedule.id,
      relatedType: 'PerformanceSchedule',
    });

    return schedule;
  }

  async update(id: number, data: any, operatorId?: number) {
    const schedule = await this.prisma.performanceSchedule.update({ where: { id }, data });
    
    await this.systemLogService.create({
      action: 'UPDATE',
      module: 'performance',
      description: `更新演出排期: ${schedule.title}`,
      operatorId,
      relatedId: schedule.id,
      relatedType: 'PerformanceSchedule',
    });

    return schedule;
  }

  async remove(id: number, operatorId?: number) {
    const schedule = await this.prisma.performanceSchedule.delete({ where: { id } });
    
    await this.systemLogService.create({
      action: 'DELETE',
      module: 'performance',
      description: `删除演出排期: ${schedule.title}`,
      operatorId,
      relatedId: id,
      relatedType: 'PerformanceSchedule',
    });

    return schedule;
  }
}
