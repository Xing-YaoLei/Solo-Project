import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '../../prisma';
import { CreateOrderDto, UpdateOrderStatusDto, AssignOrderDto, FilterOrderDto } from './order.dto';

@Injectable()
export class OrderService {
  private generateOrderNo(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `ORD-${y}${m}${d}-${seq}`;
  }

  async create(dto: CreateOrderDto) {
    const ticketTypeIds = dto.items.map((item) => item.ticketTypeId);

    const ticketTypes = await prisma.ticketType.findMany({
      where: { id: { in: ticketTypeIds } },
    });

    const ticketTypeMap = new Map(ticketTypes.map((tt) => [tt.id, tt]));

    for (const item of dto.items) {
      const tt = ticketTypeMap.get(item.ticketTypeId);
      if (!tt) throw new NotFoundException(`TicketType ${item.ticketTypeId} not found`);
      if (tt.soldCount >= tt.quota) {
        throw new BadRequestException(`TicketType ${tt.name} is sold out`);
      }
    }

    const seatIds = dto.items.map((item) => item.seatId).filter(Boolean) as string[];
    if (seatIds.length > 0) {
      const seats = await prisma.seat.findMany({
        where: { id: { in: seatIds } },
      });
      for (const seat of seats) {
        if (seat.status !== 'available') {
          throw new BadRequestException(`Seat ${seat.seatNo} is not available`);
        }
      }
    }

    const totalAmount = dto.items.reduce((sum, item) => sum + item.unitPrice, 0);

    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          eventId: dto.eventId,
          orderNo: this.generateOrderNo(),
          buyerName: dto.buyerName,
          buyerPhone: dto.buyerPhone,
          buyerEmail: dto.buyerEmail,
          totalAmount,
          status: 'pending',
        },
      });

      for (const item of dto.items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            ticketTypeId: item.ticketTypeId,
            seatId: item.seatId ?? null,
            unitPrice: item.unitPrice,
            status: 'valid',
          },
        });

        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: { soldCount: { increment: 1 } },
        });

        if (item.seatId) {
          await tx.seat.update({
            where: { id: item.seatId },
            data: { status: 'sold' },
          });
        }
      }

      return tx.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });
    });
  }

  async findAll(filter: FilterOrderDto) {
    const where: Record<string, unknown> = {};

    if (filter.eventId) where.eventId = filter.eventId;
    if (filter.status) where.status = filter.status;
    if (filter.assigneeId) where.assigneeId = filter.assigneeId;

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
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          event: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              ticketType: { select: { id: true, name: true } },
              seat: { select: { id: true, seatNo: true } },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        event: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            ticketType: { select: { id: true, name: true } },
            seat: { select: { id: true, seatNo: true } },
          },
        },
      },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(id);

    if (order.status === 'cancelled' || order.status === 'refunded') {
      throw new BadRequestException(`Cannot update status of a ${order.status} order`);
    }

    if (dto.status === 'cancelled') {
      return prisma.$transaction(async (tx) => {
        const updated = await tx.order.update({
          where: { id },
          data: { status: 'cancelled' },
        });

        const items = await tx.orderItem.findMany({
          where: { orderId: id },
        });

        for (const item of items) {
          await tx.orderItem.update({
            where: { id: item.id },
            data: { status: 'cancelled' },
          });

          await tx.ticketType.update({
            where: { id: item.ticketTypeId },
            data: { soldCount: { decrement: 1 } },
          });

          if (item.seatId) {
            await tx.seat.update({
              where: { id: item.seatId },
              data: { status: 'available' },
            });
          }
        }

        return tx.order.findUnique({
          where: { id },
          include: { items: true },
        });
      });
    }

    if (dto.status === 'refunded') {
      return prisma.$transaction(async (tx) => {
        const updated = await tx.order.update({
          where: { id },
          data: { status: 'refunded' },
        });

        const items = await tx.orderItem.findMany({
          where: { orderId: id },
        });

        for (const item of items) {
          await tx.orderItem.update({
            where: { id: item.id },
            data: { status: 'refunded' },
          });

          await tx.ticketType.update({
            where: { id: item.ticketTypeId },
            data: { soldCount: { decrement: 1 } },
          });

          if (item.seatId) {
            await tx.seat.update({
              where: { id: item.seatId },
              data: { status: 'available' },
            });
          }
        }

        return tx.order.findUnique({
          where: { id },
          include: { items: true },
        });
      });
    }

    return prisma.order.update({
      where: { id },
      data: { status: dto.status },
      include: { items: true },
    });
  }

  async assign(id: string, dto: AssignOrderDto) {
    await this.findOne(id);
    return prisma.order.update({
      where: { id },
      data: { assigneeId: dto.assigneeId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        items: true,
      },
    });
  }
}
