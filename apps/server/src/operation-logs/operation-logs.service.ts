import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryOperationLogDto } from './dto/query-operation-log.dto';
import { LogAction } from '@prisma/client';
import { CurrentUserType } from '../auth/current-user.decorator';

@Injectable()
export class OperationLogsService {
  constructor(private prisma: PrismaService) {}

  async create(
    entityType: string,
    entityId: string,
    action: LogAction,
    operatorId: string,
    oldValue?: string | null,
    newValue?: string | null,
    remark?: string,
    batchOperationId?: string,
  ) {
    return this.prisma.operationLog.create({
      data: {
        action,
        entityType,
        entityId,
        oldValue,
        newValue,
        remark,
        operatorId,
        batchOperationId,
      },
    });
  }

  async findAll(query: QueryOperationLogDto) {
    const { page = 1, pageSize = 10, entityType, entityId, actions, operatorId, batchOperationId, keyword } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (actions && actions.length > 0) {
      where.action = { in: actions };
    }

    if (operatorId) {
      where.operatorId = operatorId;
    }

    if (batchOperationId) {
      where.batchOperationId = batchOperationId;
    }

    if (keyword) {
      where.remark = { contains: keyword };
    }

    const [list, total] = await Promise.all([
      this.prisma.operationLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          operator: { select: { id: true, name: true, avatarUrl: true, role: true } },
        },
      }),
      this.prisma.operationLog.count({ where }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    return this.prisma.operationLog.findUnique({
      where: { id },
      include: {
        operator: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
    });
  }

  async getByEntity(entityType: string, entityId: string, query: QueryOperationLogDto) {
    const { page = 1, pageSize = 10, actions } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {
      entityType,
      entityId,
    };

    if (actions && actions.length > 0) {
      where.action = { in: actions };
    }

    const [list, total] = await Promise.all([
      this.prisma.operationLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          operator: { select: { id: true, name: true, avatarUrl: true, role: true } },
        },
      }),
      this.prisma.operationLog.count({ where }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getByOperator(operatorId: string, query: QueryOperationLogDto) {
    const { page = 1, pageSize = 10, entityType, actions } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {
      operatorId,
    };

    if (entityType) {
      where.entityType = entityType;
    }

    if (actions && actions.length > 0) {
      where.action = { in: actions };
    }

    const [list, total] = await Promise.all([
      this.prisma.operationLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          operator: { select: { id: true, name: true, avatarUrl: true, role: true } },
        },
      }),
      this.prisma.operationLog.count({ where }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getOperationStats(query: QueryOperationLogDto) {
    const { entityType, operatorId, startDate, endDate } = query as any;

    const where: any = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (operatorId) {
      where.operatorId = operatorId;
    }

    if (startDate) {
      where.createdAt = { ...(where.createdAt || {}), gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { ...(where.createdAt || {}), lte: new Date(endDate) };
    }

    const logs = await this.prisma.operationLog.findMany({
      where,
      select: {
        action: true,
      },
    });

    const stats: Record<string, number> = {};
    for (const log of logs) {
      stats[log.action] = (stats[log.action] || 0) + 1;
    }

    return {
      total: logs.length,
      byAction: stats,
    };
  }

  async createLog(
    entityType: string,
    entityId: string,
    action: LogAction,
    user: CurrentUserType,
    oldValue?: any,
    newValue?: any,
    remark?: string,
    batchOperationId?: string,
  ) {
    return this.create(
      entityType,
      entityId,
      action,
      user.id,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      remark,
      batchOperationId,
    );
  }
}
