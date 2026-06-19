import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogService } from '../system-log/system-log.service';
import { NotificationService } from '../notification/notification.service';
import { DisputeStatus, LogAction, OrderStatus, Role } from '@prisma/client';

@Injectable()
export class DisputeService {
  constructor(
    private prisma: PrismaService,
    private systemLogService: SystemLogService,
    private notificationService: NotificationService,
  ) {}

  async findAll(params?: {
    orderId?: number;
    status?: DisputeStatus;
    handlerId?: number;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const { orderId, status, handlerId, startDate, endDate, page = 1, pageSize = 20 } = params || {};
    const where: any = {};

    if (orderId) where.orderId = orderId;
    if (status) where.status = status;
    if (handlerId) where.handlerId = handlerId;
    if (startDate) where.createdAt = { gte: startDate };
    if (endDate) {
      if (where.createdAt) {
        where.createdAt.lte = endDate;
      } else {
        where.createdAt = { lte: endDate };
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.refundDispute.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            include: {
              schedule: true,
              ticketType: true,
            },
          },
          handler: true,
          _count: { select: { logs: true } },
        },
      }),
      this.prisma.refundDispute.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async findById(id: number) {
    return this.prisma.refundDispute.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            schedule: true,
            ticketType: true,
          },
        },
        handler: true,
        logs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async create(data: {
    orderId: number;
    title: string;
    reason: string;
    initiatorId?: number;
    handlerId?: number;
  }) {
    const order = await this.prisma.order.findUnique({ 
      where: { id: data.orderId },
      include: { schedule: true },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    const dispute = await this.prisma.refundDispute.create({
      data: {
        orderId: data.orderId,
        title: data.title,
        reason: data.reason,
        status: DisputeStatus.OPEN,
        initiatorId: data.initiatorId,
        handlerId: data.handlerId,
        logs: {
          create: [
            {
              action: LogAction.DISPUTE_OPEN,
              description: `发起退票争议: ${data.reason}`,
              operatorId: data.initiatorId,
            },
          ],
        },
      },
      include: { order: { include: { schedule: true } } },
    });

    // 更新订单状态为退票申请中
    await this.prisma.order.update({
      where: { id: data.orderId },
      data: { status: OrderStatus.REFUND_REQUESTED },
    });

    // 记录系统日志
    await this.systemLogService.create({
      action: 'DISPUTE_OPEN',
      module: 'dispute',
      description: `发起退票争议: ${dispute.title} - 订单: ${order.orderNo}`,
      operatorId: data.initiatorId,
      relatedId: dispute.id,
      relatedType: 'RefundDispute',
    });

    // 通知相关角色（运营经理、财务）
    await this.notificationService.notifyRoles(Role.OPERATION_MANAGER as any, {
      title: '新退票争议待处理',
      content: `订单 ${order.orderNo} 发起退票争议：${data.title}，请及时处理。`,
      type: 'dispute',
      relatedId: dispute.id,
      relatedType: 'RefundDispute',
    });

    await this.notificationService.notifyRoles(Role.FINANCE as any, {
      title: '新退票争议待处理',
      content: `订单 ${order.orderNo} 发起退票争议：${data.title}，请关注。`,
      type: 'dispute',
      relatedId: dispute.id,
      relatedType: 'RefundDispute',
    });

    if (data.handlerId) {
      await this.notificationService.create({
        userId: data.handlerId,
        title: '退票争议分配通知',
        content: `您被分配处理退票争议：${data.title}，订单号：${order.orderNo}`,
        type: 'dispute',
        relatedId: dispute.id,
        relatedType: 'RefundDispute',
      });
    }

    return dispute;
  }

  async updateStatus(id: number, status: DisputeStatus, operatorId?: number, remark?: string) {
    const oldDispute = await this.prisma.refundDispute.findUnique({ where: { id } });
    
    const updateData: any = { status };
    if (status === DisputeStatus.CLOSED || status === DisputeStatus.RESOLVED) {
      updateData.closeTime = new Date();
    }

    const dispute = await this.prisma.refundDispute.update({
      where: { id },
      data: updateData,
      include: { order: { include: { schedule: true } } },
    });

    // 添加争议日志
    await this.prisma.disputeLog.create({
      data: {
        disputeId: id,
        action: status === DisputeStatus.CLOSED ? LogAction.DISPUTE_CLOSE : LogAction.DISPUTE_RESOLVE,
        description: `状态变更为 ${status}${remark ? ': ' + remark : ''}`,
        operatorId,
      },
    });

    // 记录系统日志
    await this.systemLogService.create({
      action: status === DisputeStatus.CLOSED ? 'DISPUTE_CLOSE' : 'UPDATE',
      module: 'dispute',
      description: `退票争议状态变更: ${dispute.title} -> ${status}`,
      operatorId,
      relatedId: dispute.id,
      relatedType: 'RefundDispute',
    });

    // 如果是已关闭或已解决，更新订单状态
    if (status === DisputeStatus.RESOLVED) {
      await this.prisma.order.update({
        where: { id: dispute.orderId },
        data: { status: OrderStatus.REFUND_APPROVED },
      });
    }

    return dispute;
  }

  async addLog(id: number, data: {
    action: LogAction | string;
    description: string;
    operatorId?: number;
  }) {
    const log = await this.prisma.disputeLog.create({
      data: {
        disputeId: id,
        action: data.action as LogAction,
        description: data.description,
        operatorId: data.operatorId,
      },
    });

    await this.systemLogService.create({
      action: 'UPDATE',
      module: 'dispute',
      description: `争议处理记录: ${data.description}`,
      operatorId: data.operatorId,
      relatedId: id,
      relatedType: 'RefundDispute',
    });

    return log;
  }

  async assignHandler(id: number, handlerId: number, operatorId?: number) {
    const dispute = await this.prisma.refundDispute.update({
      where: { id },
      data: { handlerId, status: DisputeStatus.PROCESSING },
      include: { order: { include: { schedule: true } } },
    });

    await this.prisma.disputeLog.create({
      data: {
        disputeId: id,
        action: LogAction.UPDATE,
        description: `分配处理人`,
        operatorId,
      },
    });

    await this.notificationService.create({
      userId: handlerId,
      title: '退票争议处理通知',
      content: `您被分配处理退票争议：${dispute.title}，请尽快处理。`,
      type: 'dispute',
      relatedId: dispute.id,
      relatedType: 'RefundDispute',
    });

    return dispute;
  }

  async resolveDispute(id: number, data: {
    resolution: string;
    operatorId: number;
    approveRefund?: boolean;
  }) {
    const dispute = await this.prisma.refundDispute.update({
      where: { id },
      data: {
        resolution: data.resolution,
        status: DisputeStatus.RESOLVED,
        closeTime: new Date(),
      },
      include: { order: { include: { schedule: true } } },
    });

    await this.prisma.disputeLog.create({
      data: {
        disputeId: id,
        action: LogAction.DISPUTE_RESOLVE,
        description: `争议解决: ${data.resolution}`,
        operatorId: data.operatorId,
      },
    });

    if (data.approveRefund) {
      await this.prisma.order.update({
        where: { id: dispute.orderId },
        data: { status: OrderStatus.REFUNDED },
      });
    }

    await this.systemLogService.create({
      action: 'DISPUTE_RESOLVE',
      module: 'dispute',
      description: `退票争议已解决: ${dispute.title}`,
      operatorId: data.operatorId,
      relatedId: dispute.id,
      relatedType: 'RefundDispute',
    });

    return dispute;
  }

  async closeDispute(id: number, data: {
    resolution: string;
    operatorId: number;
  }) {
    const dispute = await this.prisma.refundDispute.update({
      where: { id },
      data: {
        resolution: data.resolution,
        status: DisputeStatus.CLOSED,
        closeTime: new Date(),
      },
      include: { order: { include: { schedule: true } } },
    });

    await this.prisma.disputeLog.create({
      data: {
        disputeId: id,
        action: LogAction.DISPUTE_CLOSE,
        description: `争议关闭: ${data.resolution}`,
        operatorId: data.operatorId,
      },
    });

    await this.systemLogService.create({
      action: 'DISPUTE_CLOSE',
      module: 'dispute',
      description: `退票争议已关闭: ${dispute.title}`,
      operatorId: data.operatorId,
      relatedId: dispute.id,
      relatedType: 'RefundDispute',
    });

    return dispute;
  }

  async getLogs(id: number) {
    return this.prisma.disputeLog.findMany({
      where: { disputeId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getDisputeStats(params?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    const { startDate, endDate } = params || {};
    const where: any = {};

    if (startDate) where.createdAt = { gte: startDate };
    if (endDate) {
      if (where.createdAt) {
        where.createdAt.lte = endDate;
      } else {
        where.createdAt = { lte: endDate };
      }
    }

    const disputes = await this.prisma.refundDispute.findMany({ where });
    
    const stats = {
      total: disputes.length,
      open: disputes.filter(d => d.status === DisputeStatus.OPEN).length,
      processing: disputes.filter(d => d.status === DisputeStatus.PROCESSING).length,
      resolved: disputes.filter(d => d.status === DisputeStatus.RESOLVED).length,
      closed: disputes.filter(d => d.status === DisputeStatus.CLOSED).length,
    };

    return stats;
  }
}
