import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogService } from '../system-log/system-log.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private systemLogService: SystemLogService,
  ) {}

  async findAll(params?: {
    scheduleId?: number;
    ticketTypeId?: number;
    status?: OrderStatus;
    buyerName?: string;
    buyerPhone?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const { scheduleId, ticketTypeId, status, buyerName, buyerPhone, startDate, endDate, page = 1, pageSize = 20 } = params || {};
    const where: any = {};

    if (scheduleId) where.scheduleId = scheduleId;
    if (ticketTypeId) where.ticketTypeId = ticketTypeId;
    if (status) where.status = status;
    if (buyerName) where.buyerName = { contains: buyerName };
    if (buyerPhone) where.buyerPhone = { contains: buyerPhone };
    if (startDate) where.createdAt = { gte: startDate };
    if (endDate) {
      if (where.createdAt) {
        where.createdAt.lte = endDate;
      } else {
        where.createdAt = { lte: endDate };
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          schedule: { select: { id: true, title: true, startTime: true, venue: true } },
          ticketType: { select: { id: true, name: true, price: true } },
          creator: { select: { id: true, name: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async findById(id: number) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        schedule: true,
        ticketType: true,
        creator: true,
        changeLogs: {
          orderBy: { createdAt: 'desc' },
        },
        verifications: {
          include: { verifier: { select: { id: true, name: true } } },
          orderBy: { verifyTime: 'desc' },
        },
        disputes: {
          include: { handler: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async generateOrderNo(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        },
      },
    });
    return `ORD${dateStr}${String(count + 1).padStart(4, '0')}`;
  }

  async create(data: {
    scheduleId: number;
    ticketTypeId: number;
    buyerName: string;
    buyerPhone: string;
    quantity: number;
    totalAmount: number;
    status?: OrderStatus;
    creatorId: number;
    remark?: string;
  }) {
    const orderNo = await this.generateOrderNo();
    const order = await this.prisma.order.create({
      data: {
        ...data,
        orderNo,
      },
      include: { schedule: true, ticketType: true },
    });

    if (data.status !== OrderStatus.PENDING) {
      await this.prisma.ticketType.update({
        where: { id: data.ticketTypeId },
        data: { soldCount: { increment: data.quantity } },
      });
    }

    await this.systemLogService.create({
      action: 'CREATE',
      module: 'order',
      description: `创建订单: ${orderNo}`,
      operatorId: data.creatorId,
      relatedId: order.id,
      relatedType: 'Order',
    });

    return order;
  }

  async update(id: number, data: any, operatorId?: number) {
    const oldOrder = await this.prisma.order.findUnique({
      where: { id },
      include: { schedule: true, ticketType: true },
    });

    const order = await this.prisma.order.update({
      where: { id },
      data,
      include: { schedule: true, ticketType: true },
    });

    const changeLogs: any[] = [];
    const simpleFields = ['buyerName', 'buyerPhone', 'quantity', 'totalAmount', 'status', 'remark'];
    for (const field of simpleFields) {
      if (data[field] !== undefined && data[field] !== oldOrder[field]) {
        changeLogs.push({
          orderId: id,
          fieldName: field,
          oldValue: oldOrder[field]?.toString() || null,
          newValue: data[field]?.toString() || null,
          operatorId,
        });
      }
    }

    if (data.scheduleId !== undefined && data.scheduleId !== oldOrder.scheduleId) {
      changeLogs.push({
        orderId: id,
        fieldName: 'scheduleId',
        oldValue: oldOrder.schedule ? `${oldOrder.scheduleId} (${oldOrder.schedule.title})` : String(oldOrder.scheduleId),
        newValue: order.schedule ? `${order.scheduleId} (${order.schedule.title})` : String(order.scheduleId),
        operatorId,
      });
    }

    if (data.ticketTypeId !== undefined && data.ticketTypeId !== oldOrder.ticketTypeId) {
      changeLogs.push({
        orderId: id,
        fieldName: 'ticketTypeId',
        oldValue: oldOrder.ticketType ? `${oldOrder.ticketTypeId} (${oldOrder.ticketType.name})` : String(oldOrder.ticketTypeId),
        newValue: order.ticketType ? `${order.ticketTypeId} (${order.ticketType.name})` : String(order.ticketTypeId),
        operatorId,
      });
    }

    if (changeLogs.length > 0) {
      await this.prisma.orderChangeLog.createMany({ data: changeLogs });
    }

    await this.systemLogService.create({
      action: 'UPDATE',
      module: 'order',
      description: `更新订单: ${order.orderNo}`,
      operatorId,
      relatedId: order.id,
      relatedType: 'Order',
    });

    return order;
  }

  async updateStatus(id: number, status: OrderStatus, operatorId?: number, remark?: string) {
    const oldOrder = await this.prisma.order.findUnique({ where: { id } });
    const order = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: { schedule: true, ticketType: true },
    });

    await this.prisma.orderChangeLog.create({
      data: {
        orderId: id,
        fieldName: 'status',
        oldValue: oldOrder.status,
        newValue: status,
        operatorId,
        remark,
      },
    });

    await this.systemLogService.create({
      action: 'UPDATE',
      module: 'order',
      description: `订单状态变更: ${order.orderNo} -> ${status}`,
      operatorId,
      relatedId: order.id,
      relatedType: 'Order',
    });

    if (status === OrderStatus.REFUND_REQUESTED && oldOrder.status !== OrderStatus.REFUND_REQUESTED) {
      // 退票请求会触发争议，由 dispute 模块处理
    }

    return order;
  }

  async getChangeLogs(orderId: number) {
    return this.prisma.orderChangeLog.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
