import prisma from '@/lib/prisma';
import {
  type DashboardOverview,
  type SeatTrendDataPoint,
  type AreaHeatmapData,
  type OrderComposition,
  type TicketTypeDetail,
  type LockRecordDetail,
  type OccupancyRateSpec,
  OCCUPANCY_RATE_SPEC,
  OrderSourceLabels,
  PaymentMethodLabels,
} from '@/types';
import { calculateOccupancyRate } from '@/lib/utils';
import { SeatStatus, OrderStatus, UserRole } from '@prisma/client';

const OCCUPANCY_CONFIG_KEY = 'occupancy_rate_spec';

async function getLastDataUpdateTime(activityIds?: string[]): Promise<Date> {
  try {
    const where = activityIds && activityIds.length > 0
      ? { activityId: { in: activityIds } }
      : {};

    const [seatUpdate, orderUpdate, lockUpdate] = await Promise.all([
      prisma.seatAllocation.findFirst({
        where,
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      prisma.order.findFirst({
        where,
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      prisma.lockRecord.findFirst({
        where,
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    const updates = [seatUpdate?.updatedAt, orderUpdate?.updatedAt, lockUpdate?.createdAt]
      .filter(Boolean) as Date[];

    if (updates.length === 0) return new Date();

    return new Date(Math.max(...updates.map(d => d.getTime())));
  } catch {
    return new Date();
  }
}

export async function getOccupancyRateSpec(): Promise<OccupancyRateSpec> {
  return {
    ...OCCUPANCY_RATE_SPEC,
    updateTime: new Date(),
  };
}

export async function getDashboardOverview(activityIds?: string[]): Promise<DashboardOverview> {
  const where = activityIds && activityIds.length > 0
    ? { activityId: { in: activityIds } }
    : {};

  const [totalSeatsRecord, soldSeatsRecord, lockedSeatsRecord, reservedSeatsRecord, anomalyCountRecord] = await Promise.all([
    prisma.seatAllocation.count({ where }),
    prisma.seatAllocation.count({ where: { ...where, status: SeatStatus.sold } }),
    prisma.seatAllocation.count({ where: { ...where, status: SeatStatus.locked } }),
    prisma.seatAllocation.count({ where: { ...where, status: SeatStatus.reserved } }),
    prisma.lockRecord.count({ where: { ...where, isAnomaly: true } }),
  ]);

  const totalSeats = totalSeatsRecord || 0;
  const soldSeats = soldSeatsRecord || 0;
  const lockedSeats = lockedSeatsRecord || 0;
  const reservedSeats = reservedSeatsRecord || 0;
  const anomalyCount = anomalyCountRecord || 0;

  const occupancyRate = calculateOccupancyRate(soldSeats, totalSeats, reservedSeats);
  const lastRefreshedAt = await getLastDataUpdateTime(activityIds);
  const occupancyRateSpec = await getOccupancyRateSpec();

  return {
    totalSeats,
    soldSeats,
    occupancyRate,
    lockedSeats,
    anomalyCount,
    lastRefreshedAt,
    occupancyRateSpec,
  };
}

export async function getSeatTrendData(activityIds?: string[], days: number = 30): Promise<SeatTrendDataPoint[]> {
  const where = activityIds && activityIds.length > 0
    ? { activityId: { in: activityIds } }
    : {};

  const data: SeatTrendDataPoint[] = [];
  const now = new Date();
  let cumulativeSold = 0;

  const soldSeatsByDate = new Map<string, number>();
  const lockedSeatsByDate = new Map<string, number>();

  let totalSeats = 0;
  let reservedSeats = 0;

  try {
    [totalSeats, reservedSeats] = await Promise.all([
      prisma.seatAllocation.count({ where }),
      prisma.seatAllocation.count({ where: { ...where, status: SeatStatus.reserved } }),
    ]);

    const soldRecords = await prisma.seatAllocation.findMany({
      where: {
        ...where,
        status: SeatStatus.sold,
        soldAt: { not: null },
      },
      select: { soldAt: true },
    });

    for (const record of soldRecords) {
      if (record.soldAt) {
        const dateStr = record.soldAt.toISOString().split('T')[0];
        soldSeatsByDate.set(dateStr, (soldSeatsByDate.get(dateStr) || 0) + 1);
      }
    }

    const lockRecords = await prisma.lockRecord.findMany({
      where,
      select: { lockedAt: true },
    });

    for (const record of lockRecords) {
      const dateStr = record.lockedAt.toISOString().split('T')[0];
      lockedSeatsByDate.set(dateStr, (lockedSeatsByDate.get(dateStr) || 0) + 1);
    }
  } catch {
    // 如果数据库查询失败，使用空数据
  }

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const sold = soldSeatsByDate.get(dateStr) || 0;
    const locked = lockedSeatsByDate.get(dateStr) || 0;

    const available = Math.max(0, totalSeats - cumulativeSold - locked - reservedSeats);
    const reserved = reservedSeats;

    cumulativeSold += sold;

    data.push({
      date: dateStr,
      timestamp: date.getTime(),
      sold,
      locked,
      available,
      reserved,
      cumulativeSold,
    });
  }

  return data;
}

export async function getAreaHeatmapData(activityIds?: string[]): Promise<AreaHeatmapData[]> {
  const where = activityIds && activityIds.length > 0
    ? { activityId: { in: activityIds } }
    : {};

  try {
    const seatAllocations = await prisma.seatAllocation.findMany({
      where,
      select: {
        area: true,
        row: true,
        seatNumber: true,
        status: true,
      },
      orderBy: [
        { area: 'asc' },
        { row: 'asc' },
        { seatNumber: 'asc' },
      ],
    });

    const areaMap = new Map<string, Map<string, { total: number; sold: number }>>();

    for (const seat of seatAllocations) {
      if (!areaMap.has(seat.area)) {
        areaMap.set(seat.area, new Map());
      }
      const rowMap = areaMap.get(seat.area)!;
      if (!rowMap.has(seat.row)) {
        rowMap.set(seat.row, { total: 0, sold: 0 });
      }
      const rowData = rowMap.get(seat.row)!;
      rowData.total += 1;
      if (seat.status === SeatStatus.sold) {
        rowData.sold += 1;
      }
    }

    const result: AreaHeatmapData[] = [];
    for (const [area, rowMap] of areaMap) {
      let totalSeats = 0;
      let soldSeats = 0;
      const rows: AreaHeatmapData['rows'] = [];

      for (const [row, data] of rowMap) {
        totalSeats += data.total;
        soldSeats += data.sold;
        rows.push({
          row,
          total: data.total,
          sold: data.sold,
          rate: data.total > 0 ? data.sold / data.total : 0,
        });
      }

      result.push({
        area,
        totalSeats,
        soldSeats,
        occupancyRate: totalSeats > 0 ? soldSeats / totalSeats : 0,
        rows,
      });
    }

    return result;
  } catch {
    return [];
  }
}

export async function getOrderComposition(activityIds?: string[]): Promise<OrderComposition> {
  const where = activityIds && activityIds.length > 0
    ? { activityId: { in: activityIds } }
    : {};

  try {
    const orders = await prisma.order.findMany({
      where: {
        ...where,
        status: { in: [OrderStatus.paid, OrderStatus.pending] },
      },
      include: {
        ticketType: true,
      },
    });

    const bySourceMap = new Map<string, number>();
    const byPaymentMap = new Map<string, number>();
    const byTicketTypeMap = new Map<string, { name: string; value: number }>();
    const byDateMap = new Map<string, { count: number; amount: number }>();

    let totalAmount = 0;
    const totalOrders = orders.length;

    for (const order of orders) {
      bySourceMap.set(order.source, (bySourceMap.get(order.source) || 0) + 1);
      byPaymentMap.set(order.paymentMethod, (byPaymentMap.get(order.paymentMethod) || 0) + 1);

      const ticketTypeName = order.ticketType?.name || '未知票种';
      if (!byTicketTypeMap.has(order.ticketTypeId)) {
        byTicketTypeMap.set(order.ticketTypeId, { name: ticketTypeName, value: 0 });
      }
      const ttData = byTicketTypeMap.get(order.ticketTypeId)!;
      ttData.value += 1;

      const dateStr = order.createdAt.toISOString().split('T')[0];
      if (!byDateMap.has(dateStr)) {
        byDateMap.set(dateStr, { count: 0, amount: 0 });
      }
      const dateData = byDateMap.get(dateStr)!;
      dateData.count += 1;
      dateData.amount += Number(order.amount);
      totalAmount += Number(order.amount);
    }

    const bySource = Array.from(bySourceMap.entries()).map(([name, value]) => ({
      name,
      value,
      label: OrderSourceLabels[name as keyof typeof OrderSourceLabels] || name,
    }));

    const byPaymentMethod = Array.from(byPaymentMap.entries()).map(([name, value]) => ({
      name,
      value,
      label: PaymentMethodLabels[name as keyof typeof PaymentMethodLabels] || name,
    }));

    const byTicketType = Array.from(byTicketTypeMap.values()).map(item => ({
      name: item.name,
      value: item.value,
      label: item.name,
    }));

    const byDate = Array.from(byDateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        count: data.count,
        amount: Math.round(data.amount),
      }));

    return {
      bySource,
      byPaymentMethod,
      byTicketType,
      byDate,
      totalAmount: Math.round(totalAmount),
      totalOrders,
    };
  } catch {
    return {
      bySource: [],
      byPaymentMethod: [],
      byTicketType: [],
      byDate: [],
      totalAmount: 0,
      totalOrders: 0,
    };
  }
}

export async function getTicketTypes(activityIds?: string[]): Promise<TicketTypeDetail[]> {
  const where = activityIds && activityIds.length > 0
    ? { activityId: { in: activityIds } }
    : {};

  try {
    const ticketTypes = await prisma.ticketType.findMany({
      where,
      orderBy: { price: 'desc' },
    });

    return ticketTypes.map(tt => {
      const price = Number(tt.price);
      const originalPrice = Number(tt.originalPrice);
      const remainingCount = tt.totalStock - tt.soldCount - tt.lockedCount;

      return {
        id: tt.id,
        name: tt.name,
        price,
        originalPrice,
        discount: originalPrice > 0 ? (originalPrice - price) / originalPrice : 0,
        totalStock: tt.totalStock,
        soldCount: tt.soldCount,
        lockedCount: tt.lockedCount,
        remainingCount: Math.max(0, remainingCount),
        occupancyRate: tt.totalStock > 0 ? tt.soldCount / tt.totalStock : 0,
        maxPerOrder: tt.maxPerOrder,
        saleStartTime: tt.saleStartTime,
        saleEndTime: tt.saleEndTime,
        description: tt.description,
        restrictions: tt.restrictions,
      };
    });
  } catch {
    return [];
  }
}

interface LockRecordsQuery {
  activityIds?: string[];
  anomalyOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export async function getLockRecords({
  activityIds,
  anomalyOnly = false,
  page = 1,
  pageSize = 20,
}: LockRecordsQuery = {}): Promise<{
  records: LockRecordDetail[];
  total: number;
  anomalyCount: number;
}> {
  const where: any = {};

  if (activityIds && activityIds.length > 0) {
    where.activityId = { in: activityIds };
  }

  if (anomalyOnly) {
    where.isAnomaly = true;
  }

  try {
    const [total, anomalyCount, records] = await Promise.all([
      prisma.lockRecord.count({ where }),
      prisma.lockRecord.count({ where: { ...where, isAnomaly: true } }),
      prisma.lockRecord.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [
          { isAnomaly: 'desc' },
          { lockedAt: 'desc' },
        ],
        include: {
          seatAllocation: true,
          order: true,
        },
      }),
    ]);

    const now = new Date();
    const detailRecords: LockRecordDetail[] = records.map(record => {
      const seat = record.seatAllocation;
      const seatInfo = seat ? `${seat.area}区${seat.row}排${seat.seatNumber}号` : '未知座位';

      let status: 'active' | 'expired' | 'released' = 'active';
      if (record.releasedAt) {
        status = 'released';
      } else if (record.expiredAt < now) {
        status = 'expired';
      }

      return {
        id: record.id,
        seatInfo,
        area: seat?.area || '',
        row: seat?.row || '',
        seatNumber: seat?.seatNumber || '',
        orderNo: record.order?.orderNo || null,
        operatorName: record.operatorName,
        lockReason: record.lockReason,
        lockDuration: record.lockDuration,
        lockedAt: record.lockedAt,
        expiredAt: record.expiredAt,
        releasedAt: record.releasedAt,
        isAnomaly: record.isAnomaly,
        anomalyType: record.anomalyType,
        anomalyDescription: record.anomalyDescription,
        originalRecordUrl: record.originalRecordUrl,
        status,
      };
    });

    return {
      records: detailRecords,
      total,
      anomalyCount,
    };
  } catch {
    return {
      records: [],
      total: 0,
      anomalyCount: 0,
    };
  }
}

export async function validateShareToken(token: string): Promise<{
  valid: boolean;
  role?: UserRole;
  activityIds?: string[];
  expiresAt?: Date;
  error?: string;
}> {
  try {
    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
    });

    if (!shareLink) {
      return { valid: false, error: '链接不存在' };
    }

    if (shareLink.expiresAt < new Date()) {
      return { valid: false, error: '链接已过期' };
    }

    return {
      valid: true,
      role: shareLink.role,
      activityIds: shareLink.activityIds,
      expiresAt: shareLink.expiresAt,
    };
  } catch {
    return { valid: false, error: '验证失败' };
  }
}

export function filterDataByRole<T>(
  data: T,
  role: UserRole,
  dataType: 'overview' | 'seatTrend' | 'orders' | 'ticketTypes' | 'lockRecords'
): T {
  return data;
}
