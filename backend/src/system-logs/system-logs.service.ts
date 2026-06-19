import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogAction } from '@prisma/client';

@Injectable()
export class SystemLogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    entityType?: string;
    entityId?: string;
    action?: LogAction;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const { entityType, entityId, action, startDate, endDate, page = 1, pageSize = 20 } = params;
    
    const where: any = {};
    
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [data, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.systemLog.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async create(data: {
    entityType: string;
    entityId: string;
    action: LogAction;
    reason?: string;
    details?: string;
    createdById?: string;
  }) {
    return this.prisma.systemLog.create({ data });
  }

  async closeLog(
    id: string,
    closeReason: string,
    closedById?: string,
  ) {
    return this.prisma.systemLog.update({
      where: { id },
      data: {
        closedAt: new Date(),
        closedById,
        closeReason,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.systemLog.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });
  }
}
