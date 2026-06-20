import { Injectable } from '@nestjs/common';
import { prisma } from '../../prisma';
import { FilterOperationLogDto } from './operation-log.dto';

@Injectable()
export class OperationLogService {
  async log(entityType: string, entityId: string, action: string, operatorId: string, detail?: any): Promise<void> {
    await prisma.operationLog.create({
      data: {
        entityType,
        entityId,
        action,
        operatorId,
        detail: detail ?? undefined,
      },
    });
  }

  async findAll(filter: FilterOperationLogDto) {
    const where: Record<string, unknown> = {};

    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.entityId) where.entityId = filter.entityId;
    if (filter.action) where.action = filter.action;
    if (filter.operatorId) where.operatorId = filter.operatorId;

    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {
        ...(filter.dateFrom && { gte: new Date(filter.dateFrom) }),
        ...(filter.dateTo && { lte: new Date(filter.dateTo) }),
      };
    }

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.operationLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          operator: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.operationLog.count({ where }),
    ]);

    return { data: items, total, page, limit };
  }

  async findByEntity(entityType: string, entityId: string) {
    return prisma.operationLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      include: {
        operator: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
