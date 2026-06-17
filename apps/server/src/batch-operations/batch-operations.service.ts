import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateBatchOperationDto } from './dto/create-batch-operation.dto';
import { QueryBatchOperationDto } from './dto/query-batch-operation.dto';
import { BatchOperationType, LogAction, ChangeOrderStatus, UserRole } from '@prisma/client';
import { CurrentUserType } from '../auth/current-user.decorator';

@Injectable()
export class BatchOperationsService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  private getProgressKey(batchId: string): string {
    return `batch:progress:${batchId}`;
  }

  async create(createBatchOperationDto: CreateBatchOperationDto, user: CurrentUserType) {
    const { type, name, description, entityIds, targetStatus, assigneeId, remark } = createBatchOperationDto;

    if (type === BatchOperationType.STATUS_UPDATE && !targetStatus) {
      throw new BadRequestException('状态更新操作必须指定目标状态');
    }

    if (type === BatchOperationType.ASSIGN && !assigneeId) {
      throw new BadRequestException('分配操作必须指定分配人');
    }

    const batchOperation = await this.prisma.batchOperation.create({
      data: {
        type,
        name,
        description,
        totalCount: entityIds.length,
        operatorId: user.id,
        payload: JSON.stringify({ targetStatus, assigneeId, remark }),
        items: {
          create: entityIds.map((entityId) => ({
            entityType: 'DesignChangeOrder',
            entityId,
            status: 'PENDING',
          })),
        },
      },
      include: {
        items: true,
      },
    });

    await this.redisService.set(
      this.getProgressKey(batchOperation.id),
      JSON.stringify({
        total: entityIds.length,
        completed: 0,
        success: 0,
        failed: 0,
        status: 'PROCESSING',
      }),
      3600,
    );

    this.executeBatchOperation(batchOperation.id, user).catch((error) => {
      console.error('Batch operation failed:', error);
    });

    return batchOperation;
  }

  private async executeBatchOperation(batchId: string, user: CurrentUserType) {
    const batchOperation = await this.prisma.batchOperation.findUnique({
      where: { id: batchId },
      include: { items: true },
    });

    if (!batchOperation) {
      return;
    }

    const { type, items } = batchOperation;
    const payload = JSON.parse(batchOperation.payload || '{}');
    let successCount = 0;
    let failCount = 0;

    for (const item of items) {
      try {
        let result: any;

        switch (type) {
          case BatchOperationType.STATUS_UPDATE:
            result = await this.processStatusUpdate(item.entityId, payload.targetStatus, payload.remark, user);
            break;
          case BatchOperationType.ASSIGN:
            result = await this.processAssign(item.entityId, payload.assigneeId, user);
            break;
          case BatchOperationType.NOTIFY:
            result = await this.processNotify(item.entityId, payload.remark, user);
            break;
          case BatchOperationType.EXPORT:
            result = await this.processExport(item.entityId, user);
            break;
          default:
            throw new BadRequestException(`不支持的操作类型: ${type}`);
        }

        await this.prisma.batchOperationItem.update({
          where: { id: item.id },
          data: {
            status: 'SUCCESS',
            result: JSON.stringify(result),
          },
        });

        successCount++;
      } catch (error: any) {
        await this.prisma.batchOperationItem.update({
          where: { id: item.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          },
        });

        failCount++;
      }

      const completed = successCount + failCount;
      await this.redisService.set(
        this.getProgressKey(batchId),
        JSON.stringify({
          total: items.length,
          completed,
          success: successCount,
          failed: failCount,
          status: 'PROCESSING',
        }),
        3600,
      );
    }

    await this.prisma.batchOperation.update({
      where: { id: batchId },
      data: {
        status: 'COMPLETED',
        successCount,
        failCount,
        completedAt: new Date(),
      },
    });

    await this.redisService.set(
      this.getProgressKey(batchId),
      JSON.stringify({
        total: items.length,
        completed: items.length,
        success: successCount,
        failed: failCount,
        status: 'COMPLETED',
      }),
      3600,
    );

    await this.prisma.operationLog.create({
      data: {
        action: LogAction.BATCH_OPERATION,
        entityType: 'BatchOperation',
        entityId: batchId,
        remark: `批量操作完成: ${batchOperation.name}，成功 ${successCount} 条，失败 ${failCount} 条`,
        operatorId: user.id,
        batchOperationId: batchId,
      },
    });
  }

  private async processStatusUpdate(entityId: string, targetStatus: ChangeOrderStatus, remark: string | undefined, user: CurrentUserType) {
    const changeOrder = await this.prisma.designChangeOrder.findUnique({
      where: { id: entityId },
    });

    if (!changeOrder) {
      throw new NotFoundException(`变更单 ${entityId} 不存在`);
    }

    const oldValue = JSON.stringify(changeOrder);

    const updated = await this.prisma.designChangeOrder.update({
      where: { id: entityId },
      data: {
        status: targetStatus,
        ...(targetStatus === ChangeOrderStatus.OWNER_APPROVED && { approvedAt: new Date() }),
        ...(targetStatus === ChangeOrderStatus.ACCEPTED && { completedAt: new Date() }),
      },
    });

    await this.prisma.changeStatusLog.create({
      data: {
        changeOrderId: entityId,
        oldStatus: changeOrder.status,
        newStatus: targetStatus,
        remark,
        operatorId: user.id,
      },
    });

    await this.prisma.operationLog.create({
      data: {
        action: LogAction.STATUS_CHANGE,
        entityType: 'DesignChangeOrder',
        entityId,
        oldValue,
        newValue: JSON.stringify(updated),
        remark: `状态变更: ${changeOrder.status} -> ${targetStatus}${remark ? ` (${remark})` : ''}`,
        operatorId: user.id,
      },
    });

    return updated;
  }

  private async processAssign(entityId: string, assigneeId: string, user: CurrentUserType) {
    const changeOrder = await this.prisma.designChangeOrder.findUnique({
      where: { id: entityId },
    });

    if (!changeOrder) {
      throw new NotFoundException(`变更单 ${entityId} 不存在`);
    }

    const oldValue = JSON.stringify(changeOrder);

    const updated = await this.prisma.designChangeOrder.update({
      where: { id: entityId },
      data: { designerId: assigneeId },
    });

    await this.prisma.operationLog.create({
      data: {
        action: LogAction.UPDATE,
        entityType: 'DesignChangeOrder',
        entityId,
        oldValue,
        newValue: JSON.stringify(updated),
        remark: '批量分配设计师',
        operatorId: user.id,
      },
    });

    return updated;
  }

  private async processNotify(entityId: string, remark: string | undefined, user: CurrentUserType) {
    const changeOrder = await this.prisma.designChangeOrder.findUnique({
      where: { id: entityId },
    });

    if (!changeOrder) {
      throw new NotFoundException(`变更单 ${entityId} 不存在`);
    }

    await this.prisma.operationLog.create({
      data: {
        action: LogAction.COMMENT,
        entityType: 'DesignChangeOrder',
        entityId,
        remark: remark || '批量通知',
        operatorId: user.id,
      },
    });

    return { notified: true };
  }

  private async processExport(entityId: string, user: CurrentUserType) {
    const changeOrder = await this.prisma.designChangeOrder.findUnique({
      where: { id: entityId },
      include: {
        project: { select: { id: true, name: true } },
        designer: { select: { id: true, name: true } },
      },
    });

    if (!changeOrder) {
      throw new NotFoundException(`变更单 ${entityId} 不存在`);
    }

    return changeOrder;
  }

  async getProgress(batchId: string) {
    const cacheKey = this.getProgressKey(batchId);
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const batchOperation = await this.prisma.batchOperation.findUnique({
      where: { id: batchId },
      include: {
        _count: {
          select: {
            items: {
              where: { status: 'SUCCESS' },
            },
          },
        },
      },
    });

    if (!batchOperation) {
      throw new NotFoundException('批量操作不存在');
    }

    const successCount = batchOperation._count.items;
    const failCount = batchOperation.failCount;

    return {
      total: batchOperation.totalCount,
      completed: successCount + failCount,
      success: successCount,
      failed: failCount,
      status: batchOperation.status,
    };
  }

  async findAll(query: QueryBatchOperationDto) {
    const { page = 1, pageSize = 10, type, operatorId, status, keyword } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (operatorId) {
      where.operatorId = operatorId;
    }

    if (status) {
      where.status = status;
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    const [list, total] = await Promise.all([
      this.prisma.batchOperation.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          operator: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      this.prisma.batchOperation.count({ where }),
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
    const batchOperation = await this.prisma.batchOperation.findUnique({
      where: { id },
      include: {
        operator: { select: { id: true, name: true, avatarUrl: true } },
        items: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!batchOperation) {
      throw new NotFoundException('批量操作不存在');
    }

    return batchOperation;
  }

  async getItemDetails(batchId: string, itemId: string) {
    const item = await this.prisma.batchOperationItem.findFirst({
      where: {
        id: itemId,
        batchOperationId: batchId,
      },
      include: {
        batchOperation: true,
      },
    });

    if (!item) {
      throw new NotFoundException('批量操作条目不存在');
    }

    const entity = await this.prisma.designChangeOrder.findUnique({
      where: { id: item.entityId },
      select: {
        id: true,
        orderNo: true,
        title: true,
        status: true,
      },
    });

    return {
      ...item,
      entity,
    };
  }

  async getFailedItems(batchId: string) {
    const batchOperation = await this.prisma.batchOperation.findUnique({
      where: { id: batchId },
    });

    if (!batchOperation) {
      throw new NotFoundException('批量操作不存在');
    }

    const items = await this.prisma.batchOperationItem.findMany({
      where: {
        batchOperationId: batchId,
        status: 'FAILED',
      },
      orderBy: { id: 'asc' },
    });

    return items;
  }

  async retryFailed(batchId: string, user: CurrentUserType) {
    const batchOperation = await this.prisma.batchOperation.findUnique({
      where: { id: batchId },
      include: {
        items: {
          where: { status: 'FAILED' },
        },
      },
    });

    if (!batchOperation) {
      throw new NotFoundException('批量操作不存在');
    }

    if (batchOperation.items.length === 0) {
      return { message: '没有需要重试的失败项' };
    }

    const failedItems = batchOperation.items;
    await this.prisma.batchOperation.update({
      where: { id: batchId },
      data: {
        status: 'PROCESSING',
        completedAt: null,
      },
    });

    for (const item of failedItems) {
      await this.prisma.batchOperationItem.update({
        where: { id: item.id },
        data: {
          status: 'PENDING',
          errorMessage: null,
          result: null,
        },
      });
    }

    await this.redisService.set(
      this.getProgressKey(batchId),
      JSON.stringify({
        total: batchOperation.totalCount,
        completed: batchOperation.successCount,
        success: batchOperation.successCount,
        failed: 0,
        status: 'PROCESSING',
      }),
      3600,
    );

    this.retryFailedItems(batchId, failedItems, user).catch((error) => {
      console.error('Retry batch operation failed:', error);
    });

    return { message: '已开始重试失败项', retryCount: failedItems.length };
  }

  private async retryFailedItems(batchId: string, items: any[], user: CurrentUserType) {
    const batchOperation = await this.prisma.batchOperation.findUnique({
      where: { id: batchId },
    });

    if (!batchOperation) {
      return;
    }

    const { type } = batchOperation;
    const payload = JSON.parse(batchOperation.payload || '{}');
    let successCount = batchOperation.successCount;
    let failCount = 0;

    for (const item of items) {
      try {
        let result: any;

        switch (type) {
          case BatchOperationType.STATUS_UPDATE:
            result = await this.processStatusUpdate(item.entityId, payload.targetStatus, payload.remark, user);
            break;
          case BatchOperationType.ASSIGN:
            result = await this.processAssign(item.entityId, payload.assigneeId, user);
            break;
          case BatchOperationType.NOTIFY:
            result = await this.processNotify(item.entityId, payload.remark, user);
            break;
          case BatchOperationType.EXPORT:
            result = await this.processExport(item.entityId, user);
            break;
        }

        await this.prisma.batchOperationItem.update({
          where: { id: item.id },
          data: {
            status: 'SUCCESS',
            result: JSON.stringify(result),
            errorMessage: null,
          },
        });

        successCount++;
      } catch (error: any) {
        await this.prisma.batchOperationItem.update({
          where: { id: item.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          },
        });

        failCount++;
      }

      const completed = successCount + failCount;
      await this.redisService.set(
        this.getProgressKey(batchId),
        JSON.stringify({
          total: batchOperation.totalCount,
          completed,
          success: successCount,
          failed: failCount,
          status: 'PROCESSING',
        }),
        3600,
      );
    }

    await this.prisma.batchOperation.update({
      where: { id: batchId },
      data: {
        status: 'COMPLETED',
        successCount,
        failCount,
        completedAt: new Date(),
      },
    });

    await this.redisService.set(
      this.getProgressKey(batchId),
      JSON.stringify({
        total: batchOperation.totalCount,
        completed: batchOperation.totalCount,
        success: successCount,
        failed: failCount,
        status: 'COMPLETED',
      }),
      3600,
    );
  }
}
