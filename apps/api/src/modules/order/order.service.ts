import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StatusHistoryService } from '../../common/status-history/status-history.service';
import { nanoid } from 'nanoid';

export interface OrderItemInput {
  ticketTypeId: string;
  seatId?: string;
  quantity: number;
}

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private history: StatusHistoryService,
  ) {}

  async list(query: { activityId?: string; status?: string; keyword?: string; page?: number; pageSize?: number }) {
    const { activityId, status, keyword, page = 1, pageSize = 20 } = query;
    const where: any = {};
    if (activityId) where.activityId = activityId;
    if (status) where.status = status;
    if (keyword) {
      where.OR = [
        { orderNo: { contains: keyword } },
        { customerName: { contains: keyword } },
        { customerPhone: { contains: keyword } },
      ];
    }
    const [list, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { orderItems: { include: { ticketType: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { list, total, page, pageSize };
  }

  async findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: { include: { ticketType: true, seat: true } },
        checkInCodes: true,
        refunds: true,
      },
    });
  }

  async create(input: {
    activityId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    items: OrderItemInput[];
    sourceChannel?: string;
    operatorId?: string;
    remark?: string;
  }) {
    if (!input.items?.length) throw new BadRequestException('订单至少包含一个票种');

    return this.prisma.$transaction(async (tx) => {
      const itemsDetail = await Promise.all(
        input.items.map(async (item) => {
          const tt = await tx.ticketType.findUnique({ where: { id: item.ticketTypeId } });
          if (!tt) throw new BadRequestException(`票种 ${item.ticketTypeId} 不存在`);
          if (tt.status !== 'ACTIVE') throw new BadRequestException(`票种「${tt.name}」不在在售状态`);
          if (tt.soldCount + item.quantity > tt.totalStock) {
            throw new BadRequestException(`票种「${tt.name}」库存不足`);
          }
          return { ticketType: tt, quantity: item.quantity, seatId: item.seatId };
        }),
      );

      const totalAmount = itemsDetail.reduce(
        (s, d) => s + d.ticketType.price.toNumber() * d.quantity,
        0,
      );

      const orderNo = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const order = await tx.order.create({
        data: {
          orderNo,
          activityId: input.activityId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail,
          totalAmount,
          status: 'PENDING',
          sourceChannel: input.sourceChannel || 'ONLINE',
          operatorId: input.operatorId,
          remark: input.remark,
          orderItems: {
            create: itemsDetail.map((d) => ({
              ticketTypeId: d.ticketType.id,
              seatId: d.seatId,
              quantity: d.quantity,
              unitPrice: d.ticketType.price,
              subtotal: d.ticketType.price.toNumber() * d.quantity,
            })),
          },
        },
        include: { orderItems: true },
      });

      await this.history.record({
        entityType: 'Order',
        entityId: order.id,
        toStatus: 'PENDING',
        activityId: input.activityId,
        orderId: order.id,
        changeNote: `订单创建，订单号 ${orderNo}`,
        changedBy: input.operatorId || 'system',
      });

      return order;
    });
  }

  async pay(orderId: string, paymentMethod: string, operatorId?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { activity: true } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== 'PENDING') throw new BadRequestException('订单状态不允许支付');

    const activityEndTime = order.activity?.endTime;
    const expireAt = activityEndTime
      ? new Date(activityEndTime.getTime() + 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paidAmount: order.totalAmount,
          paymentMethod,
          paidAt: new Date(),
        },
        include: { orderItems: { include: { ticketType: true } } },
      });

      for (const oi of updated.orderItems) {
        await tx.ticketType.update({
          where: { id: oi.ticketTypeId },
          data: { soldCount: { increment: oi.quantity } },
        });

        for (let q = 0; q < oi.quantity; q++) {
          const code = `CI${updated.orderNo}-${oi.id.slice(-4)}-${q}-${nanoid(4)}`;
          await tx.checkInCode.create({
            data: {
              orderId: orderId,
              orderItemId: oi.id,
              activityId: order.activityId,
              code,
              ticketName: oi.ticketType.name,
              customerName: order.customerName,
              expireAt,
            },
          });
        }

        if (oi.seatId) {
          await tx.seat.update({
            where: { id: oi.seatId },
            data: { status: 'OCCUPIED' },
          });
        }
      }

      await this.history.record({
        entityType: 'Order',
        entityId: orderId,
        fromStatus: 'PENDING',
        toStatus: 'PAID',
        activityId: order.activityId,
        orderId,
        changedBy: operatorId || 'system',
        changeNote: `支付成功，方式：${paymentMethod}`,
      });

      return updated;
    });
  }

  async transition(orderId: string, toStatus: string, reason?: string, note?: string, operatorId?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('订单不存在');
    const allowed = ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'REFUNDING', 'REFUNDED', 'DISPUTED'];
    if (!allowed.includes(toStatus)) throw new BadRequestException(`不允许变更为 ${toStatus}`);

    const data: any = { status: toStatus as any };
    const now = new Date();
    if (toStatus === 'CONFIRMED') data.confirmedAt = now;
    if (toStatus === 'COMPLETED') { data.completedAt = now; if (!data.confirmedAt) data.confirmedAt = now; }
    if (toStatus === 'CANCELLED') data.cancelledAt = now;

    const updated = await this.prisma.order.update({ where: { id: orderId }, data });

    await this.history.record({
      entityType: 'Order',
      entityId: orderId,
      fromStatus: order.status,
      toStatus,
      activityId: order.activityId,
      orderId,
      changedBy: operatorId || 'system',
      changeReason: reason,
      changeNote: note,
    });

    return updated;
  }

  async listHistory(orderId: string) {
    return this.history.query('Order', orderId);
  }
}
