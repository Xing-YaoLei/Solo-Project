import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '../../prisma';
import {
  CreateDisputeDto,
  UpdateDisputeStatusDto,
  AssignDisputeDto,
  FilterDisputeDto,
  FilterNotificationDto,
} from './dispute.dto';

@Injectable()
export class DisputeService {
  private async createNotification(disputeId: string, userId: string, type: string, message: string) {
    return prisma.disputeNotification.create({
      data: { disputeId, userId, type, message },
    });
  }

  private async logOperation(entityId: string, action: string, operatorId: string, detail?: object) {
    return prisma.operationLog.create({
      data: { entityType: 'dispute', entityId, action, operatorId, detail: detail ?? undefined },
    });
  }

  async create(dto: CreateDisputeDto) {
    const order = await prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException(`Order ${dto.orderId} not found`);

    const orderItem = await prisma.orderItem.findUnique({ where: { id: dto.orderItemId } });
    if (!orderItem) throw new NotFoundException(`OrderItem ${dto.orderItemId} not found`);

    const assigneeId = dto.assigneeId ?? order.assigneeId;
    if (!assigneeId) throw new BadRequestException('No assignee available for this dispute');

    const dispute = await prisma.refundDispute.create({
      data: {
        orderId: dto.orderId,
        orderItemId: dto.orderItemId,
        refundRuleId: dto.refundRuleId ?? null,
        reason: dto.reason,
        evidence: dto.evidence ?? undefined,
        status: 'pending',
        assigneeId,
      },
    });

    await this.createNotification(
      dispute.id,
      assigneeId,
      'created',
      `New dispute created for order ${order.orderNo}`,
    );

    await this.logOperation(dispute.id, 'created', dto.operatorId);

    return prisma.refundDispute.findUnique({
      where: { id: dispute.id },
      include: {
        order: { select: { id: true, orderNo: true } },
        assignee: { select: { id: true, name: true, email: true } },
        refundRule: true,
      },
    });
  }

  async findAll(filter: FilterDisputeDto) {
    const where: Record<string, unknown> = {};
    if (filter.status) where.status = filter.status;
    if (filter.assigneeId) where.assigneeId = filter.assigneeId;
    if (filter.orderId) where.orderId = filter.orderId;

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
      prisma.refundDispute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { id: true, orderNo: true } },
          assignee: { select: { id: true, name: true, email: true } },
          refundRule: true,
        },
      }),
      prisma.refundDispute.count({ where }),
    ]);

    return { data: items, total, page, limit };
  }

  async findOne(id: string) {
    const dispute = await prisma.refundDispute.findUnique({
      where: { id },
      include: {
        order: { select: { id: true, orderNo: true } },
        assignee: { select: { id: true, name: true, email: true } },
        refundRule: true,
        notifications: true,
      },
    });
    if (!dispute) throw new NotFoundException(`Dispute ${id} not found`);
    return dispute;
  }

  async updateStatus(id: string, dto: UpdateDisputeStatusDto) {
    const dispute = await this.findOne(id);
    if (dispute.status === 'closed') throw new BadRequestException('Cannot update a closed dispute');

    const updated = await prisma.refundDispute.update({
      where: { id },
      data: { status: dto.status },
      include: {
        order: { select: { id: true, orderNo: true } },
        assignee: { select: { id: true, name: true, email: true } },
        refundRule: true,
      },
    });

    if (updated.assigneeId) {
      await this.createNotification(
        id,
        updated.assigneeId,
        dto.status,
        `Dispute status changed to ${dto.status}`,
      );
    }

    await this.logOperation(id, dto.status, dto.operatorId);

    return updated;
  }

  async assign(id: string, dto: AssignDisputeDto) {
    await this.findOne(id);

    const updated = await prisma.refundDispute.update({
      where: { id },
      data: { assigneeId: dto.assigneeId },
      include: {
        order: { select: { id: true, orderNo: true } },
        assignee: { select: { id: true, name: true, email: true } },
        refundRule: true,
      },
    });

    await this.createNotification(
      id,
      dto.assigneeId,
      'reassigned',
      `Dispute has been reassigned to you`,
    );

    await this.logOperation(id, 'reassigned', dto.operatorId, { assigneeId: dto.assigneeId });

    return updated;
  }

  async getNotifications(disputeId: string) {
    await this.findOne(disputeId);
    return prisma.disputeNotification.findMany({
      where: { disputeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserNotifications(filter: FilterNotificationDto) {
    const where: Record<string, unknown> = {};
    if (filter.userId) where.userId = filter.userId;
    if (filter.isRead !== undefined) where.isRead = filter.isRead;

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.disputeNotification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          dispute: { select: { id: true, status: true, reason: true } },
        },
      }),
      prisma.disputeNotification.count({ where }),
    ]);

    return { data: items, total, page, limit };
  }

  async markAsRead(notificationId: string) {
    const notification = await prisma.disputeNotification.findUnique({ where: { id: notificationId } });
    if (!notification) throw new NotFoundException(`Notification ${notificationId} not found`);
    return prisma.disputeNotification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }
}
