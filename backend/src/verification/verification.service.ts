import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogService } from '../system-log/system-log.service';
import { OrderService } from '../order/order.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class VerificationService {
  constructor(
    private prisma: PrismaService,
    private systemLogService: SystemLogService,
    private orderService: OrderService,
  ) {}

  async findAll(params?: {
    orderId?: number;
    verifierId?: number;
    scheduleId?: number;
    startDate?: Date;
    endDate?: Date;
    verifyMethod?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { orderId, verifierId, scheduleId, startDate, endDate, verifyMethod, page = 1, pageSize = 20 } = params || {};
    const where: any = {};

    if (orderId) where.orderId = orderId;
    if (verifierId) where.verifierId = verifierId;
    if (verifyMethod) where.verifyMethod = verifyMethod;
    if (startDate) where.verifyTime = { gte: startDate };
    if (endDate) {
      if (where.verifyTime) {
        where.verifyTime.lte = endDate;
      } else {
        where.verifyTime = { lte: endDate };
      }
    }
    if (scheduleId) {
      where.order = { scheduleId };
    }

    const [data, total] = await Promise.all([
      this.prisma.verificationRecord.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { verifyTime: 'desc' },
        include: {
          order: {
            include: {
              schedule: { select: { id: true, title: true, startTime: true, venue: true } },
              ticketType: { select: { id: true, name: true } },
            },
          },
          verifier: { select: { id: true, name: true, role: true } },
        },
      }),
      this.prisma.verificationRecord.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async findById(id: number) {
    return this.prisma.verificationRecord.findUnique({
      where: { id },
      include: {
        order: { include: { schedule: true, ticketType: true } },
        verifier: true,
      },
    });
  }

  async verify(data: {
    orderId: number;
    verifierId: number;
    quantity?: number;
    verifyMethod: string;
    remark?: string;
  }) {
    const order = await this.prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order) {
      throw new Error('订单不存在');
    }
    if (order.status !== OrderStatus.PAID && order.status !== OrderStatus.PENDING) {
      if (order.status === OrderStatus.VERIFIED) {
        throw new Error('订单已核销');
      }
      throw new Error('订单状态不允许核销');
    }

    const quantity = data.quantity || order.quantity;

    const verification = await this.prisma.verificationRecord.create({
      data: {
        orderId: data.orderId,
        verifierId: data.verifierId,
        quantity,
        verifyMethod: data.verifyMethod,
        remark: data.remark,
      },
      include: { order: { include: { schedule: true } } },
    });

    if (quantity >= order.quantity) {
      await this.orderService.updateStatus(data.orderId, OrderStatus.VERIFIED, data.verifierId, '订单已核销');
    }

    await this.systemLogService.create({
      action: 'VERIFY',
      module: 'verification',
      description: `核销订单: ${order.orderNo}`,
      operatorId: data.verifierId,
      relatedId: verification.id,
      relatedType: 'VerificationRecord',
    });

    return verification;
  }

  async getVerificationStats(params?: {
    scheduleId?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { scheduleId, startDate, endDate } = params || {};
    const where: any = {};

    if (startDate) where.verifyTime = { gte: startDate };
    if (endDate) {
      if (where.verifyTime) {
        where.verifyTime.lte = endDate;
      } else {
        where.verifyTime = { lte: endDate };
      }
    }
    if (scheduleId) {
      where.order = { scheduleId };
    }

    const verifications = await this.prisma.verificationRecord.findMany({
      where,
      include: { order: { include: { ticketType: true } } },
    });

    const totalCount = verifications.length;
    let totalTickets = 0;
    let totalAmount = 0;

    for (const v of verifications) {
      totalTickets += v.quantity;
    }

    const methodStats: any = {};
    for (const v of verifications) {
      if (!methodStats[v.verifyMethod]) {
        methodStats[v.verifyMethod] = { count: 0, tickets: 0 };
      }
      methodStats[v.verifyMethod].count++;
      methodStats[v.verifyMethod].tickets += v.quantity;
    }

    return {
      totalCount,
      totalTickets,
      totalAmount,
      methodStats,
    };
  }
}
