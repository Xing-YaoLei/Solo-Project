import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, RoomStatus, ChannelType } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getOccupancyTrend(params: {
    propertyId?: number;
    startDate: string;
    endDate: string;
    period?: 'day' | 'week' | 'month';
  }) {
    const { propertyId, startDate, endDate, period = 'day' } = params;
    const start = new Date(startDate);
    const end = new Date(endDate);

    const dates: Date[] = [];
    let current = new Date(start);

    while (current <= end) {
      dates.push(new Date(current));
      
      if (period === 'day') {
        current.setDate(current.getDate() + 1);
      } else if (period === 'week') {
        current.setDate(current.getDate() + 7);
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }

    const totalRooms = propertyId
      ? await this.prisma.room.count({ where: { propertyId, isActive: true } })
      : await this.prisma.room.count({ where: { isActive: true } });

    const trendData = await Promise.all(
      dates.map(async (date) => {
        const nextDate = new Date(date);
        if (period === 'day') {
          nextDate.setDate(nextDate.getDate() + 1);
        } else if (period === 'week') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }

        const where: any = {
          status: { in: [OrderStatus.CONFIRMED, OrderStatus.CHECKED_IN, OrderStatus.CHECKED_OUT] },
          checkInDate: { lt: nextDate },
          checkOutDate: { gt: date },
        };
        if (propertyId) where.propertyId = propertyId;

        const occupiedRooms = await this.prisma.channelOrder.count({ where });
        const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms * 100).toFixed(1) : '0';

        return {
          date: date.toISOString().split('T')[0],
          occupiedRooms,
          totalRooms,
          occupancyRate: parseFloat(occupancyRate),
        };
      })
    );

    const avgOccupancy = trendData.length > 0
      ? (trendData.reduce((sum, d) => sum + d.occupancyRate, 0) / trendData.length).toFixed(1)
      : '0';

    const maxOccupancy = trendData.length > 0
      ? Math.max(...trendData.map(d => d.occupancyRate))
      : 0;

    const minOccupancy = trendData.length > 0
      ? Math.min(...trendData.map(d => d.occupancyRate))
      : 0;

    return {
      period,
      totalRooms,
      avgOccupancy: parseFloat(avgOccupancy),
      maxOccupancy,
      minOccupancy,
      data: trendData,
    };
  }

  async getRevenueReport(params: {
    propertyId?: number;
    startDate: string;
    endDate: string;
  }) {
    const { propertyId, startDate, endDate } = params;

    const where: any = {
      status: { in: [OrderStatus.CONFIRMED, OrderStatus.CHECKED_IN, OrderStatus.CHECKED_OUT] },
      checkInDate: { gte: new Date(startDate) },
      checkOutDate: { lte: new Date(endDate) },
    };
    if (propertyId) where.propertyId = propertyId;

    const orders = await this.prisma.channelOrder.findMany({
      where,
      select: {
        totalAmount: true,
        nights: true,
        channel: true,
        checkInDate: true,
      },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount.toNumber(), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0';
    const totalRoomNights = orders.reduce((sum, o) => sum + o.nights, 0);

    const channelBreakdown: Record<string, { orders: number; revenue: number }> = {};
    for (const order of orders) {
      if (!channelBreakdown[order.channel]) {
        channelBreakdown[order.channel] = { orders: 0, revenue: 0 };
      }
      channelBreakdown[order.channel].orders++;
      channelBreakdown[order.channel].revenue += order.totalAmount.toNumber();
    }

    return {
      period: { startDate, endDate },
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders,
      avgOrderValue: parseFloat(avgOrderValue),
      totalRoomNights,
      channelBreakdown,
    };
  }

  async getChannelDistribution(params: {
    propertyId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const { propertyId, startDate, endDate } = params;

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;
    if (startDate) where.checkInDate = { gte: new Date(startDate) };
    if (endDate) where.checkOutDate = { lte: new Date(endDate) };

    const orders = await this.prisma.channelOrder.findMany({
      where,
      select: { channel: true, totalAmount: true },
    });

    const channels: Record<string, { count: number; revenue: number }> = {};
    
    for (const order of orders) {
      if (!channels[order.channel]) {
        channels[order.channel] = { count: 0, revenue: 0 };
      }
      channels[order.channel].count++;
      channels[order.channel].revenue += order.totalAmount.toNumber();
    }

    const total = orders.length;
    const result = Object.entries(channels).map(([channel, data]) => ({
      channel,
      count: data.count,
      revenue: parseFloat(data.revenue.toFixed(2)),
      percentage: total > 0 ? parseFloat(((data.count / total) * 100).toFixed(1)) : 0,
    }));

    return { total, channels: result };
  }

  async getRoomTypePerformance(params: {
    propertyId: number;
    startDate?: string;
    endDate?: string;
  }) {
    const { propertyId, startDate, endDate } = params;

    const rooms = await this.prisma.room.findMany({
      where: { propertyId, isActive: true },
      select: { id: true, roomType: true, pricePerNight: true },
    });

    const orderWhere: any = { propertyId };
    if (startDate) orderWhere.checkInDate = { gte: new Date(startDate) };
    if (endDate) orderWhere.checkOutDate = { lte: new Date(endDate) };

    const orders = await this.prisma.channelOrder.findMany({
      where: orderWhere,
      select: { roomId: true, nights: true, totalAmount: true },
    });

    const roomTypeMap: Record<string, { rooms: number; nights: number; revenue: number }> = {};
    
    for (const room of rooms) {
      const type = room.roomType || '其他';
      if (!roomTypeMap[type]) {
        roomTypeMap[type] = { rooms: 0, nights: 0, revenue: 0 };
      }
      roomTypeMap[type].rooms++;
    }

    for (const order of orders) {
      const room = rooms.find(r => r.id === order.roomId);
      if (room) {
        const type = room.roomType || '其他';
        roomTypeMap[type].nights += order.nights;
        roomTypeMap[type].revenue += order.totalAmount.toNumber();
      }
    }

    const result = Object.entries(roomTypeMap).map(([type, data]) => ({
      roomType: type,
      roomCount: data.rooms,
      totalNights: data.nights,
      totalRevenue: parseFloat(data.revenue.toFixed(2)),
      avgDailyRate: data.nights > 0 ? parseFloat((data.revenue / data.nights).toFixed(2)) : 0,
    }));

    return result;
  }
}
