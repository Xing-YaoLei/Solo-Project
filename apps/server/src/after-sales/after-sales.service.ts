import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAfterSalesDto } from './dto/create-after-sales.dto';
import { UpdateAfterSalesDto } from './dto/update-after-sales.dto';
import { QueryAfterSalesDto } from './dto/query-after-sales.dto';
import { StatusChangeDto, BatchStatusUpdateDto } from './dto/status-change.dto';
import { AfterSalesStatus, LogAction, UserRole } from '@prisma/client';
import { CurrentUserType } from '../auth/current-user.decorator';

@Injectable()
export class AfterSalesService {
  constructor(private prisma: PrismaService) {}

  private generateTicketNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `AS-${year}${month}${day}-${random}`;
  }

  async create(createDto: CreateAfterSalesDto, user: CurrentUserType) {
    const project = await this.prisma.project.findUnique({
      where: { id: createDto.projectId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    const ticketNo = this.generateTicketNo();

    const ticket = await this.prisma.afterSalesTicket.create({
      data: {
        ...createDto,
        ticketNo,
        reporterId: user.id,
        status: AfterSalesStatus.OPEN,
      },
      include: {
        project: { select: { id: true, name: true } },
        reporter: { select: { id: true, name: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    await this.createOperationLog(
      ticket.id,
      LogAction.CREATE,
      user.id,
      null,
      JSON.stringify(ticket),
      '创建售后工单',
    );

    return ticket;
  }

  async findAll(query: QueryAfterSalesDto) {
    const {
      page = 1,
      pageSize = 10,
      projectId,
      status,
      priority,
      assigneeId,
      reporterId,
      keyword,
    } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    if (priority) {
      where.priority = priority;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (reporterId) {
      where.reporterId = reporterId;
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    const [list, total] = await Promise.all([
      this.prisma.afterSalesTicket.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, name: true } },
          reporter: { select: { id: true, name: true, avatarUrl: true } },
          assignee: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      this.prisma.afterSalesTicket.count({ where }),
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
    const ticket = await this.prisma.afterSalesTicket.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, address: true } },
        reporter: { select: { id: true, name: true, avatarUrl: true, phone: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true, phone: true } },
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
        logs: {
          orderBy: { createdAt: 'desc' },
          include: {
            operator: { select: { id: true, name: true } },
          },
          take: 20,
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('售后工单不存在');
    }

    return ticket;
  }

  async update(id: string, updateDto: UpdateAfterSalesDto, user: CurrentUserType) {
    const ticket = await this.findOne(id);

    const oldValue = JSON.stringify(ticket);

    const updated = await this.prisma.afterSalesTicket.update({
      where: { id },
      data: updateDto,
      include: {
        project: { select: { id: true, name: true } },
        reporter: { select: { id: true, name: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    await this.createOperationLog(
      id,
      LogAction.UPDATE,
      user.id,
      oldValue,
      JSON.stringify(updated),
      '更新售后工单',
    );

    return updated;
  }

  async remove(id: string, user: CurrentUserType) {
    const ticket = await this.findOne(id);

    if (ticket.status !== AfterSalesStatus.OPEN && ticket.status !== AfterSalesStatus.CLOSED) {
      throw new BadRequestException('只有待处理或已关闭状态的工单可以删除');
    }

    await this.prisma.afterSalesTicket.delete({ where: { id } });

    await this.createOperationLog(
      id,
      LogAction.DELETE,
      user.id,
      JSON.stringify(ticket),
      null,
      '删除售后工单',
    );

    return { message: '删除成功' };
  }

  async changeStatus(id: string, statusChangeDto: StatusChangeDto, user: CurrentUserType) {
    const ticket = await this.findOne(id);
    const { status, remark } = statusChangeDto;

    this.validateStatusTransition(ticket.status, status, user.role as UserRole);

    const oldValue = JSON.stringify(ticket);

    const updated = await this.prisma.afterSalesTicket.update({
      where: { id },
      data: {
        status,
        ...(status === AfterSalesStatus.RESOLVED && { resolvedAt: new Date() }),
      },
      include: {
        project: { select: { id: true, name: true } },
        reporter: { select: { id: true, name: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    await this.createOperationLog(
      id,
      LogAction.STATUS_CHANGE,
      user.id,
      oldValue,
      JSON.stringify(updated),
      `状态变更: ${ticket.status} -> ${status}${remark ? ` (${remark})` : ''}`,
    );

    return updated;
  }

  async assign(id: string, assigneeId: string, user: CurrentUserType) {
    const ticket = await this.findOne(id);

    const assignee = await this.prisma.user.findUnique({
      where: { id: assigneeId },
    });

    if (!assignee) {
      throw new NotFoundException('处理人不存在');
    }

    const oldValue = JSON.stringify(ticket);

    const updated = await this.prisma.afterSalesTicket.update({
      where: { id },
      data: { assigneeId },
      include: {
        project: { select: { id: true, name: true } },
        reporter: { select: { id: true, name: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    await this.createOperationLog(
      id,
      LogAction.UPDATE,
      user.id,
      oldValue,
      JSON.stringify(updated),
      `分配处理人: ${assignee.name}`,
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
    currentStatus: AfterSalesStatus,
    newStatus: AfterSalesStatus,
    userRole: UserRole,
  ) {
    const validTransitions: Record<AfterSalesStatus, AfterSalesStatus[]> = {
      [AfterSalesStatus.OPEN]: [AfterSalesStatus.IN_PROGRESS, AfterSalesStatus.CLOSED],
      [AfterSalesStatus.IN_PROGRESS]: [
        AfterSalesStatus.PENDING_REVIEW,
        AfterSalesStatus.OPEN,
      ],
      [AfterSalesStatus.PENDING_REVIEW]: [
        AfterSalesStatus.RESOLVED,
        AfterSalesStatus.IN_PROGRESS,
      ],
      [AfterSalesStatus.RESOLVED]: [AfterSalesStatus.CLOSED, AfterSalesStatus.IN_PROGRESS],
      [AfterSalesStatus.CLOSED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `不允许从 ${currentStatus} 状态变更为 ${newStatus} 状态`,
      );
    }

    const rolePermissions: Record<AfterSalesStatus, UserRole[]> = {
      [AfterSalesStatus.OPEN]: [UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER],
      [AfterSalesStatus.IN_PROGRESS]: [UserRole.FOREMAN, UserRole.SUPERVISOR],
      [AfterSalesStatus.PENDING_REVIEW]: [UserRole.SUPERVISOR, UserRole.OWNER],
      [AfterSalesStatus.RESOLVED]: [UserRole.OWNER, UserRole.SUPERVISOR],
      [AfterSalesStatus.CLOSED]: [],
    };

    const allowedRoles = rolePermissions[newStatus] || [];
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('您没有权限执行此状态变更');
    }
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
        entityType: 'AfterSalesTicket',
        entityId,
        oldValue,
        newValue,
        remark,
        operatorId,
      },
    });
  }
}
