import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { paginate } from '../common/utils/pagination';
import { WorkOrderStatus, QualityCheckResult } from '@prisma/client';

@Injectable()
export class StatisticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getDashboardStats() {
    const cacheKey = 'statistics:dashboard';
    const cached = await this.redisService.getJson<any>(cacheKey);

    if (cached) {
      return cached;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [statusCounts, todayRevenue] = await Promise.all([
      this.prisma.workOrder.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.workOrder.aggregate({
        _sum: {
          actualAmount: true,
        },
        where: {
          status: WorkOrderStatus.COMPLETED,
          updatedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
    ]);

    const stats: Record<string, number> = {
      total: 0,
      inProgress: 0,
      waitingParts: 0,
      completed: 0,
      todayRevenue: 0,
    };

    statusCounts.forEach((item) => {
      stats.total += item._count;
      if (item.status === WorkOrderStatus.IN_PROGRESS) {
        stats.inProgress = item._count;
      } else if (item.status === WorkOrderStatus.WAITING_PARTS) {
        stats.waitingParts = item._count;
      } else if (item.status === WorkOrderStatus.COMPLETED) {
        stats.completed = item._count;
      }
    });

    stats.todayRevenue = Number(todayRevenue._sum.actualAmount || 0);

    await this.redisService.setJson(cacheKey, stats, 300);

    return stats;
  }

  async getWorkOrderStatusDistribution() {
    const statusCounts = await this.prisma.workOrder.groupBy({
      by: ['status'],
      _count: true,
    });

    const total = statusCounts.reduce((sum, item) => sum + item._count, 0);

    return statusCounts.map((item) => ({
      status: item.status,
      count: item._count,
      percentage: total > 0 ? parseFloat(((item._count / total) * 100).toFixed(2)) : 0,
    }));
  }

  async getReworkRate(startDate?: string, endDate?: string) {
    const where: any = {
      status: WorkOrderStatus.COMPLETED,
    };

    if (startDate) {
      where.endTime = { ...where.endTime, gte: new Date(startDate) };
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.endTime = { ...where.endTime, lte: end };
    }

    const completedWorkOrders = await this.prisma.workOrder.findMany({
      where,
      include: {
        vehicle: true,
        qualityChecks: true,
      },
      orderBy: {
        vehicleId: 'asc',
      },
    });

    const vehicleWorkOrders: Record<string, typeof completedWorkOrders> = {};
    completedWorkOrders.forEach((order) => {
      if (!vehicleWorkOrders[order.vehicleId]) {
        vehicleWorkOrders[order.vehicleId] = [];
      }
      vehicleWorkOrders[order.vehicleId].push(order);
    });

    let reworkVehicleCount = 0;
    const reworkVehicles: string[] = [];

    Object.entries(vehicleWorkOrders).forEach(([vehicleId, orders]) => {
      const sortedOrders = orders.sort(
        (a, b) => new Date(a.endTime!).getTime() - new Date(b.endTime!).getTime(),
      );

      let isRework = false;

      for (let i = 0; i < sortedOrders.length; i++) {
        for (let j = i + 1; j < sortedOrders.length; j++) {
          const date1 = new Date(sortedOrders[i].endTime!);
          const date2 = new Date(sortedOrders[j].endTime!);
          const diffDays = (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24);

          if (diffDays <= 30) {
            isRework = true;
            break;
          }
        }
        if (isRework) break;
      }

      if (!isRework) {
        const hasFailedQualityCheck = sortedOrders.some((order) =>
          order.qualityChecks.some(
            (qc) => qc.result === QualityCheckResult.FAILED || qc.result === QualityCheckResult.NEEDS_REWORK,
          ),
        );
        if (hasFailedQualityCheck) {
          isRework = true;
        }
      }

      if (isRework) {
        reworkVehicleCount++;
        reworkVehicles.push(vehicleId);
      }
    });

    const totalCompletedVehicles = Object.keys(vehicleWorkOrders).length;
    const reworkRate = totalCompletedVehicles > 0
      ? parseFloat(((reworkVehicleCount / totalCompletedVehicles) * 100).toFixed(2))
      : 0;

    return {
      totalCompletedVehicles,
      reworkVehicleCount,
      reworkRate,
      reworkVehicles,
    };
  }

  async getReworkOrders(
    page: number,
    pageSize: number,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = {
      status: WorkOrderStatus.COMPLETED,
    };

    if (startDate) {
      where.endTime = { ...where.endTime, gte: new Date(startDate) };
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.endTime = { ...where.endTime, lte: end };
    }

    const completedWorkOrders = await this.prisma.workOrder.findMany({
      where,
      include: {
        vehicle: true,
        qualityChecks: true,
      },
    });

    const vehicleWorkOrders: Record<string, typeof completedWorkOrders> = {};
    completedWorkOrders.forEach((order) => {
      if (!vehicleWorkOrders[order.vehicleId]) {
        vehicleWorkOrders[order.vehicleId] = [];
      }
      vehicleWorkOrders[order.vehicleId].push(order);
    });

    const reworkOrderIds: Set<string> = new Set();

    Object.entries(vehicleWorkOrders).forEach(([vehicleId, orders]) => {
      const sortedOrders = orders.sort(
        (a, b) => new Date(a.endTime!).getTime() - new Date(b.endTime!).getTime(),
      );

      let isRework = false;
      const reworkOrdersInVehicle: string[] = [];

      for (let i = 0; i < sortedOrders.length; i++) {
        for (let j = i + 1; j < sortedOrders.length; j++) {
          const date1 = new Date(sortedOrders[i].endTime!);
          const date2 = new Date(sortedOrders[j].endTime!);
          const diffDays = (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24);

          if (diffDays <= 30) {
            isRework = true;
            reworkOrdersInVehicle.push(sortedOrders[i].id);
            reworkOrdersInVehicle.push(sortedOrders[j].id);
          }
        }
      }

      const hasFailedQualityCheckOrders = sortedOrders.filter((order) =>
        order.qualityChecks.some(
          (qc) => qc.result === QualityCheckResult.FAILED || qc.result === QualityCheckResult.NEEDS_REWORK,
        ),
      );

      if (hasFailedQualityCheckOrders.length > 0) {
        isRework = true;
        hasFailedQualityCheckOrders.forEach((order) => {
          reworkOrdersInVehicle.push(order.id);
        });
      }

      if (isRework) {
        reworkOrdersInVehicle.forEach((id) => reworkOrderIds.add(id));
      }
    });

    const skip = (page - 1) * pageSize;
    const reworkOrderIdsArray = Array.from(reworkOrderIds);
    const total = reworkOrderIdsArray.length;

    const pagedIds = reworkOrderIdsArray.slice(skip, skip + pageSize);

    const reworkOrders = await this.prisma.workOrder.findMany({
      where: {
        id: { in: pagedIds },
      },
      include: {
        vehicle: true,
        advisor: {
          select: {
            id: true,
            name: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
          },
        },
        qualityChecks: true,
      },
      orderBy: {
        endTime: 'desc',
      },
    });

    return paginate(reworkOrders, total, page, pageSize);
  }

  async getTechnicianWorkload(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { ...where.createdAt, lte: end };
    }

    const technicians = await this.prisma.user.findMany({
      where: {
        role: {
          code: 'TECHNICIAN',
        },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const workload = await Promise.all(
      technicians.map(async (tech) => {
        const techWhere = { ...where, technicianId: tech.id };

        const [totalCount, completedCount, items] = await Promise.all([
          this.prisma.workOrder.count({ where: techWhere }),
          this.prisma.workOrder.count({
            where: {
              ...techWhere,
              status: WorkOrderStatus.COMPLETED,
            },
          }),
          this.prisma.workOrderItem.findMany({
            where: {
              workOrder: techWhere,
            },
            select: {
              laborHours: true,
            },
          }),
        ]);

        const totalLaborHours = items.reduce(
          (sum, item) => sum + Number(item.laborHours || 0),
          0,
        );

        return {
          technicianId: tech.id,
          technicianName: tech.name,
          totalOrders: totalCount,
          completedOrders: completedCount,
          totalLaborHours: parseFloat(totalLaborHours.toFixed(2)),
        };
      }),
    );

    return workload.sort((a, b) => b.completedOrders - a.completedOrders);
  }

  async getServiceItemStats(startDate?: string, endDate?: string) {
    const workOrderWhere: any = {};

    if (startDate) {
      workOrderWhere.createdAt = { ...workOrderWhere.createdAt, gte: new Date(startDate) };
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      workOrderWhere.createdAt = { ...workOrderWhere.createdAt, lte: end };
    }

    const workOrderItems = await this.prisma.workOrderItem.findMany({
      where: {
        workOrder: workOrderWhere,
      },
      select: {
        itemName: true,
        itemType: true,
        laborHours: true,
        laborAmount: true,
        partAmount: true,
        totalAmount: true,
      },
    });

    const itemStats: Record<string, any> = {};

    workOrderItems.forEach((item) => {
      const key = item.itemName;
      if (!itemStats[key]) {
        itemStats[key] = {
          itemName: item.itemName,
          itemType: item.itemType,
          count: 0,
          totalLaborHours: 0,
          totalLaborAmount: 0,
          totalPartAmount: 0,
          totalAmount: 0,
        };
      }
      itemStats[key].count++;
      itemStats[key].totalLaborHours += Number(item.laborHours || 0);
      itemStats[key].totalLaborAmount += Number(item.laborAmount || 0);
      itemStats[key].totalPartAmount += Number(item.partAmount || 0);
      itemStats[key].totalAmount += Number(item.totalAmount || 0);
    });

    return Object.values(itemStats)
      .map((stat) => ({
        ...stat,
        totalLaborHours: parseFloat(stat.totalLaborHours.toFixed(2)),
        totalLaborAmount: parseFloat(stat.totalLaborAmount.toFixed(2)),
        totalPartAmount: parseFloat(stat.totalPartAmount.toFixed(2)),
        totalAmount: parseFloat(stat.totalAmount.toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count);
  }

  async getRevenueTrend(
    type: string = 'day',
    startDate?: string,
    endDate?: string,
  ) {
    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      end = new Date();
      end.setHours(23, 59, 59, 999);
      start = new Date(end);

      if (type === 'day') {
        start.setDate(start.getDate() - 29);
      } else if (type === 'week') {
        start.setDate(start.getDate() - 83);
      } else if (type === 'month') {
        start.setMonth(start.getMonth() - 11);
      }

      start.setHours(0, 0, 0, 0);
    }

    const completedOrders = await this.prisma.workOrder.findMany({
      where: {
        status: WorkOrderStatus.COMPLETED,
        endTime: {
          gte: start,
          lte: end,
        },
      },
      select: {
        endTime: true,
        actualAmount: true,
      },
      orderBy: {
        endTime: 'asc',
      },
    });

    const trend: Record<string, { date: string; revenue: number; orderCount: number }> = {};

    completedOrders.forEach((order) => {
      let key: string;
      const date = new Date(order.endTime!);

      if (type === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (type === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (type === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = date.toISOString().split('T')[0];
      }

      if (!trend[key]) {
        trend[key] = { date: key, revenue: 0, orderCount: 0 };
      }
      trend[key].revenue += Number(order.actualAmount || 0);
      trend[key].orderCount++;
    });

    const result = Object.values(trend)
      .map((item) => ({
        ...item,
        revenue: parseFloat(item.revenue.toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }

  async getPartUsageStats(startDate?: string, endDate?: string) {
    const workOrderWhere: any = {
      status: {
        not: WorkOrderStatus.CANCELLED,
      },
    };

    if (startDate) {
      workOrderWhere.createdAt = { ...workOrderWhere.createdAt, gte: new Date(startDate) };
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      workOrderWhere.createdAt = { ...workOrderWhere.createdAt, lte: end };
    }

    const partItems = await this.prisma.workOrderItemPart.findMany({
      where: {
        workOrderItem: {
          workOrder: workOrderWhere,
        },
      },
      include: {
        part: {
          select: {
            name: true,
            partNumber: true,
            category: true,
            unit: true,
          },
        },
      },
    });

    const partStats: Record<string, any> = {};

    partItems.forEach((item) => {
      const key = item.partId;
      if (!partStats[key]) {
        partStats[key] = {
          partId: item.partId,
          partName: item.part.name,
          partNumber: item.part.partNumber,
          category: item.part.category,
          unit: item.part.unit,
          totalQuantity: 0,
          totalAmount: 0,
          usageCount: 0,
        };
      }
      partStats[key].totalQuantity += item.quantity;
      partStats[key].totalAmount += Number(item.totalPrice || 0);
      partStats[key].usageCount++;
    });

    return Object.values(partStats)
      .map((stat) => ({
        ...stat,
        totalAmount: parseFloat(stat.totalAmount.toFixed(2)),
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);
  }
}
