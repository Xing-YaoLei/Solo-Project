import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogAction } from '@prisma/client';

@Injectable()
export class SystemLogService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    action: LogAction | string;
    module: string;
    description: string;
    operatorId?: number;
    operatorName?: string;
    relatedId?: number;
    relatedType?: string;
    ip?: string;
    userAgent?: string;
  }) {
    if (data.operatorId && !data.operatorName) {
      const user = await this.prisma.user.findUnique({ 
        where: { id: data.operatorId },
        select: { name: true },
      });
      if (user) data.operatorName = user.name;
    }

    return this.prisma.systemLog.create({
      data: {
        action: data.action as LogAction,
        module: data.module,
        description: data.description,
        operatorId: data.operatorId,
        operatorName: data.operatorName,
        relatedId: data.relatedId,
        relatedType: data.relatedType,
        ip: data.ip,
        userAgent: data.userAgent,
      },
    });
  }

  async findAll(params?: {
    module?: string;
    action?: LogAction;
    operatorId?: number;
    relatedId?: number;
    relatedType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const { module, action, operatorId, relatedId, relatedType, startDate, endDate, page = 1, pageSize = 20 } = params || {};
    const where: any = {};

    if (module) where.module = module;
    if (action) where.action = action;
    if (operatorId) where.operatorId = operatorId;
    if (relatedId) where.relatedId = relatedId;
    if (relatedType) where.relatedType = relatedType;
    if (startDate) where.createdAt = { gte: startDate };
    if (endDate) {
      if (where.createdAt) {
        where.createdAt.lte = endDate;
      } else {
        where.createdAt = { lte: endDate };
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.systemLog.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async findByRelated(relatedId: number, relatedType: string) {
    return this.prisma.systemLog.findMany({
      where: { relatedId, relatedType },
      orderBy: { createdAt: 'desc' },
    });
  }
}
