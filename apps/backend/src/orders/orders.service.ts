import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, ChannelType, RoomStatus, UserRole } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: any, params: {
    page?: number;
    pageSize?: number;
    propertyId?: number;
    status?: OrderStatus;
    channel?: ChannelType;
    keyword?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const { page = 1, pageSize = 10, propertyId, status, channel, keyword, dateFrom, dateTo } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;
    if (status) where.status = status;
    if (channel) where.channel = channel;
    if (keyword) {
      where.OR = [
        { orderNo: { contains: keyword } },
        { guestName: { contains: keyword } },
        { guestPhone: { contains: keyword } },
        { channelOrderNo: { contains: keyword } },
      ];
    }
    if (dateFrom) {
      where.checkInDate = { ...where.checkInDate, gte: new Date(dateFrom) };
    }
    if (dateTo) {
      where.checkOutDate = { ...where.checkOutDate, lte: new Date(dateTo) };
    }

    if (user.role === UserRole.FRONTLINE) {
      where.createdById = user.userId;
    }

    const [orders, total] = await Promise.all([
      this.prisma.channelOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { name: true } },
          room: { select: { roomNumber: true, roomType: true } },
        },
      }),
      this.prisma.channelOrder.count({ where }),
    ]);

    return { list: orders, total, page, pageSize };
  }

  async findOne(id: number) {
    const order = await this.prisma.channelOrder.findUnique({
      where: { id },
      include: {
        property: true,
        room: true,
        documents: true,
        deposits: true,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return order;
  }

  async create(data: any, userId: number) {
    const checkIn = new Date(data.checkInDate);
    const checkOut = new Date(data.checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      throw new BadRequestException('退房日期必须晚于入住日期');
    }

    const orderNo = `ORD${Date.now()}`;

    return this.prisma.channelOrder.create({
      data: {
        ...data,
        orderNo,
        nights,
        createdById: userId,
      },
    });
  }

  async update(id: number, data: any) {
    const order = await this.prisma.channelOrder.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (data.checkInDate || data.checkOutDate) {
      const checkIn = new Date(data.checkInDate || order.checkInDate);
      const checkOut = new Date(data.checkOutDate || order.checkOutDate);
      data.nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    }

    return this.prisma.channelOrder.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: number, status: OrderStatus) {
    const order = await this.prisma.channelOrder.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return this.prisma.channelOrder.update({
      where: { id },
      data: { status },
    });
  }

  async checkConflicts(propertyId: number, roomId: number, checkInDate: string, checkOutDate: string, excludeOrderId?: number) {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    const conflicts = await this.prisma.channelOrder.findMany({
      where: {
        propertyId,
        roomId,
        id: excludeOrderId ? { not: excludeOrderId } : undefined,
        status: {
          in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.CHECKED_IN],
        },
        AND: [
          { checkInDate: { lt: checkOut } },
          { checkOutDate: { gt: checkIn } },
        ],
      },
      include: {
        room: { select: { roomNumber: true } },
      },
    });

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  async remove(id: number) {
    return this.prisma.channelOrder.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  async getStatistics(user: any, params: { propertyId?: number; date?: string }) {
    const { propertyId, date } = params;
    const targetDate = date ? new Date(date) : new Date();

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;

    if (user.role === UserRole.FRONTLINE) {
      where.createdById = user.userId;
    }

    const [todayArrivals, todayDepartures, inHouse, totalOrders] = await Promise.all([
      this.prisma.channelOrder.count({
        where: {
          ...where,
          checkInDate: {
            gte: new Date(targetDate.setHours(0, 0, 0, 0)),
            lt: new Date(targetDate.setHours(24, 0, 0, 0)),
          },
          status: { in: [OrderStatus.CONFIRMED, OrderStatus.CHECKED_IN] },
        },
      }),
      this.prisma.channelOrder.count({
        where: {
          ...where,
          checkOutDate: {
            gte: new Date(targetDate.setHours(0, 0, 0, 0)),
            lt: new Date(targetDate.setHours(24, 0, 0, 0)),
          },
          status: { in: [OrderStatus.CHECKED_IN, OrderStatus.CHECKED_OUT] },
        },
      }),
      this.prisma.channelOrder.count({
        where: {
          ...where,
          checkInDate: { lte: new Date() },
          checkOutDate: { gt: new Date() },
          status: OrderStatus.CHECKED_IN,
        },
      }),
      this.prisma.channelOrder.count({ where }),
    ]);

    return {
      todayArrivals,
      todayDepartures,
      inHouse,
      totalOrders,
    };
  }
}
