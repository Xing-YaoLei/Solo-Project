import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { HandleUnauthorizedDto } from '@/notifications/dto';
import { PaginationDto, createPaginatedResult, PaginatedResult } from '@/common/dto/pagination.dto';
import { OperationAction, UnauthorizedSeverity, UnauthorizedStatus } from '@prisma/client';

const operationLogSelectFields = {
  id: true,
  operatorId: true,
  operatorName: true,
  targetType: true,
  targetId: true,
  action: true,
  description: true,
  beforeData: true,
  afterData: true,
  ipAddress: true,
  createdAt: true,
  taskId: true,
  evidenceId: true,
  operator: {
    select: {
      id: true,
      username: true,
      role: true,
    },
  },
};

const unauthorizedSelectFields = {
  id: true,
  userId: true,
  userName: true,
  userRole: true,
  resourceType: true,
  resourceId: true,
  resourceTitle: true,
  action: true,
  attemptedPermission: true,
  severity: true,
  status: true,
  handlingNote: true,
  handledAt: true,
  ipAddress: true,
  userAgent: true,
  requestParams: true,
  createdAt: true,
  updatedAt: true,
  handledBy: {
    select: { fullName: true },
  },
  user: {
    select: { id: true, username: true, department: true },
  },
};

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findOperationLogs(
    pagination: PaginationDto,
    filters?: {
      targetType?: string;
      action?: OperationAction;
      operatorId?: string;
      taskId?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<PaginatedResult<any>> {
    const { skip, take, keyword, sortBy, sortOrder } = pagination;
    const where: any = {};
    if (filters?.targetType) where.targetType = filters.targetType;
    if (filters?.action) where.action = filters.action;
    if (filters?.operatorId) where.operatorId = filters.operatorId;
    if (filters?.taskId) where.taskId = filters.taskId;

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (keyword) {
      where.OR = [
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.operationLog.count({ where }),
      this.prisma.operationLog.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: operationLogSelectFields,
      }),
    ]);

    return createPaginatedResult(data, total, pagination.page, pagination.pageSize);
  }

  async findOperationLogsByTarget(targetType: string, targetId: string, pagination: PaginationDto) {
    return this.findOperationLogs(pagination, {
      targetType,
      taskId: targetType === 'AuditTask' ? targetId : undefined,
    });
  }

  async findUnauthorizedAccess(
    pagination: PaginationDto,
    filters?: {
      userId?: string;
      resourceType?: string;
      severity?: UnauthorizedSeverity;
      status?: UnauthorizedStatus;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<PaginatedResult<any>> {
    const { skip, take, keyword, sortBy, sortOrder } = pagination;

    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.resourceType) where.resourceType = filters.resourceType;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.status) where.status = filters.status;

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (keyword) {
      where.OR = [
        { userName: { contains: keyword, mode: 'insensitive' } },
        { resourceTitle: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.unauthorizedAccess.count({ where }),
      this.prisma.unauthorizedAccess.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: unauthorizedSelectFields,
      }),
    ]);

    return createPaginatedResult(data, total, pagination.page, pagination.pageSize);
  }

  async findOneUnauthorized(id: string) {
    const record = await this.prisma.unauthorizedAccess.findUnique({
      where: { id },
      select: unauthorizedSelectFields,
    });
    if (!record) {
      throw new Error('越权记录不存在');
    }
    return record;
  }

  async handleUnauthorized(
    id: string,
    handleDto: {
      status: UnauthorizedStatus;
      severity?: UnauthorizedSeverity;
      handlingNote?: string;
    },
    handlerId: string,
  ) {
    const existing = await this.prisma.unauthorizedAccess.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('越权记录不存在');
    }

    const result = await this.prisma.unauthorizedAccess.update({
      where: { id },
      data: {
        status: handleDto.status,
        severity: handleDto.severity || existing.severity,
        handlingNote: handleDto.handlingNote,
        handledById: handlerId,
        handledAt: new Date(),
      },
      select: unauthorizedSelectFields,
    });

    this.logger.log(`处理越权记录: ${id} -> ${handleDto.status}`);
    return result;
  }

  async getAuditStats() {
    const operationCount = await this.prisma.operationLog.count();
    const operationByAction = await this.prisma.operationLog.groupBy({
      by: ['action'],
      _count: { action: true },
    });
    const operationByTarget = await this.prisma.operationLog.groupBy({
      by: ['targetType'],
      _count: { targetType: true },
    });

    const unauthorizedTotal = await this.prisma.unauthorizedAccess.count();
    const unauthorizedByStatus = await this.prisma.unauthorizedAccess.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    const unauthorizedBySeverity = await this.prisma.unauthorizedAccess.groupBy({
      by: ['severity'],
      _count: { severity: true },
    });
    const pendingUnauthorized = await this.prisma.unauthorizedAccess.count({
      where: { status: UnauthorizedStatus.PENDING },
    });

    return {
      operations: {
        total: operationCount,
        byAction: operationByAction.map((g) => ({ action: g.action, count: g._count.action })),
        byTargetType: operationByTarget.map((g) => ({ targetType: g.targetType, count: g._count.targetType })),
      },
      unauthorized: {
        total: unauthorizedTotal,
        pending: pendingUnauthorized,
        byStatus: unauthorizedByStatus.map((g) => ({ status: g.status, count: g._count.status })),
        bySeverity: unauthorizedBySeverity.map((g) => ({ severity: g.severity, count: g._count.severity })),
      },
    };
  }
}
