import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChangeOrderDto } from './dto/create-change-order.dto';
import { UpdateChangeOrderDto } from './dto/update-change-order.dto';
import { QueryChangeOrderDto } from './dto/query-change-order.dto';
import { StatusChangeDto, BatchStatusUpdateDto } from './dto/status-change.dto';
import { ChangeOrderStatus, LogAction, UserRole } from '@prisma/client';
import { CurrentUserType } from '../auth/current-user.decorator';

@Injectable()
export class ChangeOrdersService {
  constructor(private prisma: PrismaService) {}

  private generateOrderNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `CO-${year}${month}${day}-${random}`;
  }

  async create(createChangeOrderDto: CreateChangeOrderDto, user: CurrentUserType) {
    const orderNo = this.generateOrderNo();

    const changeOrder = await this.prisma.designChangeOrder.create({
      data: {
        ...createChangeOrderDto,
        orderNo,
        submittedById: user.id,
        status: ChangeOrderStatus.DRAFT,
      },
    });

    await this.createOperationLog(
      changeOrder.id,
      LogAction.CREATE,
      user.id,
      null,
      JSON.stringify(changeOrder),
      '创建设计变更单',
    );

    await this.createStatusLog(changeOrder.id, null, ChangeOrderStatus.DRAFT, null, user.id);

    return changeOrder;
  }

  async findAll(query: QueryChangeOrderDto) {
    const { page = 1, pageSize = 10, projectId, status, designerId, keyword } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    if (designerId) {
      where.designerId = designerId;
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    const [list, total] = await Promise.all([
      this.prisma.designChangeOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, name: true } },
          designer: { select: { id: true, name: true, avatarUrl: true } },
          submittedBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.designChangeOrder.count({ where }),
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
    const changeOrder = await this.prisma.designChangeOrder.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, address: true } },
        designer: { select: { id: true, name: true, avatarUrl: true } },
        submittedBy: { select: { id: true, name: true } },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            operator: { select: { id: true, name: true } },
          },
        },
        acceptancePhotos: {
          orderBy: { createdAt: 'desc' },
          include: {
            uploader: { select: { id: true, name: true } },
            reviewer: { select: { id: true, name: true } },
          },
        },
        materialDelays: {
          orderBy: { createdAt: 'desc' },
          include: {
            reportedBy: { select: { id: true, name: true } },
            handledBy: { select: { id: true, name: true } },
          },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
            attachments: true,
          },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
          include: {
            uploadedBy: { select: { id: true, name: true } },
          },
        },
        operationLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            operator: { select: { id: true, name: true } },
          },
          take: 20,
        },
      },
    });

    if (!changeOrder) {
      throw new NotFoundException('变更单不存在');
    }

    return changeOrder;
  }

  async update(id: string, updateChangeOrderDto: UpdateChangeOrderDto, user: CurrentUserType) {
    const changeOrder = await this.findOne(id);

    if (changeOrder.status !== ChangeOrderStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态的变更单可以编辑');
    }

    const oldValue = JSON.stringify(changeOrder);

    const updated = await this.prisma.designChangeOrder.update({
      where: { id },
      data: updateChangeOrderDto,
    });

    await this.createOperationLog(
      id,
      LogAction.UPDATE,
      user.id,
      oldValue,
      JSON.stringify(updated),
      '更新设计变更单',
    );

    return updated;
  }

  async remove(id: string, user: CurrentUserType) {
    const changeOrder = await this.findOne(id);

    if (changeOrder.status !== ChangeOrderStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态的变更单可以删除');
    }

    await this.prisma.designChangeOrder.delete({ where: { id } });

    return { message: '删除成功' };
  }

  async changeStatus(id: string, statusChangeDto: StatusChangeDto, user: CurrentUserType) {
    const changeOrder = await this.findOne(id);
    const { status, remark } = statusChangeDto;

    this.validateStatusTransition(changeOrder.status, status, user.role as UserRole);

    const oldValue = JSON.stringify(changeOrder);

    const updated = await this.prisma.designChangeOrder.update({
      where: { id },
      data: {
        status,
        ...(status === ChangeOrderStatus.OWNER_APPROVED && { approvedAt: new Date() }),
        ...(status === ChangeOrderStatus.ACCEPTED && { completedAt: new Date() }),
      },
    });

    await this.createStatusLog(changeOrder.id, changeOrder.status, status, remark, user.id);

    await this.createOperationLog(
      id,
      LogAction.STATUS_CHANGE,
      user.id,
      oldValue,
      JSON.stringify(updated),
      `状态变更: ${changeOrder.status} -> ${status}${remark ? ` (${remark})` : ''}`,
    );

    return updated;
  }

  async batchUpdateStatus(batchStatusUpdateDto: BatchStatusUpdateDto, user: CurrentUserType) {
    const { ids, status, remark } = batchStatusUpdateDto;
    const results = {
      success: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (const id of ids) {
      try {
        await this.changeStatus(id, { status, remark }, user);
        results.success.push(id);
      } catch (error: any) {
        results.failed.push({ id, error: error.message });
      }
    }

    return results;
  }

  private validateStatusTransition(
    currentStatus: ChangeOrderStatus,
    newStatus: ChangeOrderStatus,
    userRole: UserRole,
  ) {
    const validTransitions: Record<ChangeOrderStatus, ChangeOrderStatus[]> = {
      [ChangeOrderStatus.DRAFT]: [ChangeOrderStatus.PENDING_REVIEW, ChangeOrderStatus.CANCELLED],
      [ChangeOrderStatus.PENDING_REVIEW]: [
        ChangeOrderStatus.DESIGNER_APPROVED,
        ChangeOrderStatus.REJECTED,
        ChangeOrderStatus.DRAFT,
      ],
      [ChangeOrderStatus.DESIGNER_APPROVED]: [
        ChangeOrderStatus.OWNER_APPROVED,
        ChangeOrderStatus.REJECTED,
      ],
      [ChangeOrderStatus.OWNER_APPROVED]: [
        ChangeOrderStatus.IN_PROGRESS,
        ChangeOrderStatus.REJECTED,
      ],
      [ChangeOrderStatus.IN_PROGRESS]: [
        ChangeOrderStatus.PENDING_ACCEPTANCE,
        ChangeOrderStatus.REJECTED,
      ],
      [ChangeOrderStatus.PENDING_ACCEPTANCE]: [
        ChangeOrderStatus.ACCEPTED,
        ChangeOrderStatus.IN_PROGRESS,
      ],
      [ChangeOrderStatus.ACCEPTED]: [],
      [ChangeOrderStatus.REJECTED]: [ChangeOrderStatus.DRAFT],
      [ChangeOrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `不允许从 ${currentStatus} 状态变更为 ${newStatus} 状态`,
      );
    }

    const rolePermissions: Record<ChangeOrderStatus, UserRole[]> = {
      [ChangeOrderStatus.DRAFT]: [UserRole.DESIGNER, UserRole.FOREMAN, UserRole.OWNER],
      [ChangeOrderStatus.PENDING_REVIEW]: [UserRole.DESIGNER, UserRole.SUPERVISOR],
      [ChangeOrderStatus.DESIGNER_APPROVED]: [UserRole.OWNER],
      [ChangeOrderStatus.OWNER_APPROVED]: [UserRole.FOREMAN, UserRole.SUPERVISOR],
      [ChangeOrderStatus.IN_PROGRESS]: [UserRole.FOREMAN, UserRole.SUPERVISOR],
      [ChangeOrderStatus.PENDING_ACCEPTANCE]: [UserRole.OWNER, UserRole.SUPERVISOR],
      [ChangeOrderStatus.ACCEPTED]: [],
      [ChangeOrderStatus.REJECTED]: [UserRole.DESIGNER, UserRole.OWNER],
      [ChangeOrderStatus.CANCELLED]: [],
    };

    const allowedRoles = rolePermissions[newStatus] || [];
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('您没有权限执行此状态变更');
    }
  }

  private async createStatusLog(
    changeOrderId: string,
    oldStatus: ChangeOrderStatus | null,
    newStatus: ChangeOrderStatus,
    remark: string | null | undefined,
    operatorId: string,
  ) {
    return this.prisma.changeStatusLog.create({
      data: {
        changeOrderId,
        oldStatus,
        newStatus,
        remark,
        operatorId,
      },
    });
  }

  private async createOperationLog(
    entityId: string,
    action: LogAction,
    operatorId: string,
    oldValue: string | null,
    newValue: string | null,
    remark: string,
  ) {
    return this.prisma.operationLog.create({
      data: {
        action,
        entityType: 'DesignChangeOrder',
        entityId,
        oldValue,
        newValue,
        remark,
        operatorId,
      },
    });
  }
}
