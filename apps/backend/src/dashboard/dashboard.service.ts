import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, OrderStatus, CleaningStatus, ConflictStatus, ConflictRiskLevel, DocumentStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(user: any, propertyId?: number) {
    const propertyWhere = propertyId ? { propertyId } : {};

    const [
      totalProperties,
      totalRooms,
      todayArrivals,
      todayDepartures,
      inHouseGuests,
      pendingCleaning,
      pendingConflicts,
      highRiskConflicts,
      pendingDocuments,
    ] = await Promise.all([
      propertyId
        ? this.prisma.property.count({ where: { id: propertyId, isActive: true } })
        : this.prisma.property.count({ where: { isActive: true } }),
      propertyId
        ? this.prisma.room.count({ where: { propertyId, isActive: true } })
        : this.prisma.room.count({ where: { isActive: true } }),
      this.prisma.channelOrder.count({
        where: {
          ...propertyWhere,
          checkInDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(24, 0, 0, 0)),
          },
          status: { in: [OrderStatus.CONFIRMED, OrderStatus.CHECKED_IN] },
        },
      }),
      this.prisma.channelOrder.count({
        where: {
          ...propertyWhere,
          checkOutDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(24, 0, 0, 0)),
          },
          status: { in: [OrderStatus.CHECKED_IN, OrderStatus.CHECKED_OUT] },
        },
      }),
      this.prisma.channelOrder.count({
        where: {
          ...propertyWhere,
          checkInDate: { lte: new Date() },
          checkOutDate: { gt: new Date() },
          status: OrderStatus.CHECKED_IN,
        },
      }),
      this.prisma.cleaningTask.count({
        where: {
          ...propertyWhere,
          status: { in: [CleaningStatus.PENDING, CleaningStatus.ASSIGNED, CleaningStatus.IN_PROGRESS] },
        },
      }),
      this.prisma.roomConflict.count({
        where: {
          ...propertyWhere,
          status: { in: [ConflictStatus.OPEN, ConflictStatus.IN_PROGRESS] },
        },
      }),
      this.prisma.roomConflict.count({
        where: {
          ...propertyWhere,
          riskLevel: { in: [ConflictRiskLevel.HIGH, ConflictRiskLevel.CRITICAL] },
          status: { in: [ConflictStatus.OPEN, ConflictStatus.IN_PROGRESS] },
        },
      }),
      this.prisma.checkinDocument.count({
        where: {
          status: DocumentStatus.PENDING,
          ...(propertyId ? { order: { propertyId } } : {}),
        },
      }),
    ]);

    const occupancyRate = totalRooms > 0
      ? parseFloat(((inHouseGuests / totalRooms) * 100).toFixed(1))
      : 0;

    return {
      totalProperties,
      totalRooms,
      todayArrivals,
      todayDepartures,
      inHouseGuests,
      occupancyRate,
      pendingCleaning,
      pendingConflicts,
      highRiskConflicts,
      pendingDocuments,
    };
  }

  async getTodayTasks(user: any, propertyId?: number) {
    const propertyWhere = propertyId ? { propertyId } : {};
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));

    const tasks: any[] = [];

    const arrivals = await this.prisma.channelOrder.findMany({
      where: {
        ...propertyWhere,
        checkInDate: { gte: todayStart, lt: todayEnd },
        status: { in: [OrderStatus.CONFIRMED, OrderStatus.CHECKED_IN] },
      },
      include: {
        property: { select: { name: true } },
        room: { select: { roomNumber: true } },
      },
      take: 5,
      orderBy: { checkInDate: 'asc' },
    });

    for (const order of arrivals) {
      tasks.push({
        id: `arrival-${order.id}`,
        type: 'arrival',
        title: '今日入住',
        description: `${order.guestName} - ${order.property.name} ${order.room?.roomNumber || ''}`,
        time: order.checkInDate,
        priority: 'high',
        orderId: order.id,
      });
    }

    const departures = await this.prisma.channelOrder.findMany({
      where: {
        ...propertyWhere,
        checkOutDate: { gte: todayStart, lt: todayEnd },
        status: { in: [OrderStatus.CHECKED_IN, OrderStatus.CHECKED_OUT] },
      },
      include: {
        property: { select: { name: true } },
        room: { select: { roomNumber: true } },
      },
      take: 5,
      orderBy: { checkOutDate: 'asc' },
    });

    for (const order of departures) {
      tasks.push({
        id: `departure-${order.id}`,
        type: 'departure',
        title: '今日退房',
        description: `${order.guestName} - ${order.property.name} ${order.room?.roomNumber || ''}`,
        time: order.checkOutDate,
        priority: 'medium',
        orderId: order.id,
      });
    }

    const cleaningWhere: any = {
      ...propertyWhere,
      status: { in: [CleaningStatus.PENDING, CleaningStatus.ASSIGNED, CleaningStatus.IN_PROGRESS] },
      scheduledAt: { gte: todayStart, lte: todayEnd },
    };
    if (user.role === UserRole.FRONTLINE) {
      cleaningWhere.assignedToId = user.userId;
    }

    const cleaningTasks = await this.prisma.cleaningTask.findMany({
      where: cleaningWhere,
      include: {
        property: { select: { name: true } },
        room: { select: { roomNumber: true } },
      },
      take: 5,
      orderBy: [{ priority: 'desc' }, { scheduledAt: 'asc' }],
    });

    for (const task of cleaningTasks) {
      tasks.push({
        id: `cleaning-${task.id}`,
        type: 'cleaning',
        title: '保洁任务',
        description: `${task.property.name} ${task.room?.roomNumber || ''}`,
        time: task.scheduledAt,
        priority: task.priority >= 2 ? 'high' : 'medium',
        taskId: task.id,
      });
    }

    const highRiskConflicts = await this.prisma.roomConflict.findMany({
      where: {
        ...propertyWhere,
        riskLevel: { in: [ConflictRiskLevel.HIGH, ConflictRiskLevel.CRITICAL] },
        status: { in: [ConflictStatus.OPEN, ConflictStatus.IN_PROGRESS] },
      },
      include: {
        property: { select: { name: true } },
        room: { select: { roomNumber: true } },
      },
      take: 5,
      orderBy: [{ riskLevel: 'desc' }, { createdAt: 'desc' }],
    });

    for (const conflict of highRiskConflicts) {
      tasks.push({
        id: `conflict-${conflict.id}`,
        type: 'conflict',
        title: '房态冲突',
        description: `${conflict.conflictType} - ${conflict.property.name} ${conflict.room?.roomNumber || ''}`,
        time: conflict.createdAt,
        priority: 'critical',
        conflictId: conflict.id,
        riskLevel: conflict.riskLevel,
      });
    }

    tasks.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return {
      total: tasks.length,
      tasks: tasks.slice(0, 10),
    };
  }

  async getQuickStats(user: any, propertyId?: number) {
    const propertyWhere = propertyId ? { propertyId } : {};

    const [
      cleaningStats,
      conflictStats,
      orderStats,
    ] = await Promise.all([
      this.prisma.cleaningTask.groupBy({
        by: ['status'],
        where: propertyWhere,
        _count: { status: true },
      }),
      this.prisma.roomConflict.groupBy({
        by: ['status'],
        where: propertyWhere,
        _count: { status: true },
      }),
      this.prisma.channelOrder.groupBy({
        by: ['status'],
        where: propertyWhere,
        _count: { status: true },
      }),
    ]);

    return {
      cleaning: cleaningStats.map(s => ({ status: s.status, count: s._count.status })),
      conflicts: conflictStats.map(s => ({ status: s.status, count: s._count.status })),
      orders: orderStats.map(s => ({ status: s.status, count: s._count.status })),
    };
  }

  async getFrontlineDashboard(userId: number) {
    const myCleaningTasks = await this.prisma.cleaningTask.findMany({
      where: {
        assignedToId: userId,
        status: { in: [CleaningStatus.PENDING, CleaningStatus.ASSIGNED, CleaningStatus.IN_PROGRESS] },
      },
      include: {
        property: { select: { name: true } },
        room: { select: { roomNumber: true } },
      },
      orderBy: [{ priority: 'desc' }, { scheduledAt: 'asc' }],
      take: 10,
    });

    const myTaskStats = await this.prisma.cleaningTask.groupBy({
      by: ['status'],
      where: { assignedToId: userId },
      _count: { status: true },
    });

    return {
      myTasks: myCleaningTasks,
      myTaskStats,
    };
  }
}
