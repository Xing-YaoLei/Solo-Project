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
import { SeatStatus, OrderStatus, UserRole, AnomalyType } from '@prisma/client';

const SNAPSHOT_CACHE_TTL_MS = 5 * 60 * 1000;

interface DashboardSnapshotData {
  lastRefreshedAt: Date;
  occupancyRateSpec: OccupancyRateSpec;
  overview: DashboardOverview;
  seatTrend: SeatTrendDataPoint[];
  areaHeatmap: AreaHeatmapData[];
  orderComposition: OrderComposition;
  ticketTypes: TicketTypeDetail[];
  lockRecords: {
    records: LockRecordDetail[];
    total: number;
    anomalyCount: number;
  };
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

function normalizeActivityIds(activityIds?: string[]): string[] {
  if (!activityIds || activityIds.length === 0) return [];
  return [...new Set(activityIds)].sort();
}

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

async function getOccupancyRateSpec(): Promise<OccupancyRateSpec> {
  return {
    ...OCCUPANCY_RATE_SPEC,
    updateTime: new Date(),
  };
}

async function computeOverview(activityIds?: string[]): Promise<DashboardOverview> {
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

async function computeSeatTrend(activityIds?: string[], days: number = 30): Promise<SeatTrendDataPoint[]> {
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
      where: { ...where, status: SeatStatus.sold, soldAt: { not: null } },
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
    // empty
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

async function computeAreaHeatmap(activityIds?: string[]): Promise<AreaHeatmapData[]> {
  const where = activityIds && activityIds.length > 0
    ? { activityId: { in: activityIds } }
    : {};

  try {
    const seatAllocations = await prisma.seatAllocation.findMany({
      where,
      select: { area: true, row: true, seatNumber: true, status: true },
      orderBy: [{ area: 'asc' }, { row: 'asc' }, { seatNumber: 'asc' }],
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
      if (seat.status === SeatStatus.sold) rowData.sold += 1;
    }

    const result: AreaHeatmapData[] = [];
    for (const [area, rowMap] of areaMap) {
      let totalSeats = 0;
      let soldSeats = 0;
      const rows: AreaHeatmapData['rows'] = [];

      for (const [row, d] of rowMap) {
        totalSeats += d.total;
        soldSeats += d.sold;
        rows.push({ row, total: d.total, sold: d.sold, rate: d.total > 0 ? d.sold / d.total : 0 });
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

async function computeOrderComposition(activityIds?: string[]): Promise<OrderComposition> {
  const where = activityIds && activityIds.length > 0
    ? { activityId: { in: activityIds } }
    : {};

  try {
    const orders = await prisma.order.findMany({
      where: { ...where, status: { in: [OrderStatus.paid, OrderStatus.pending] } },
      include: { ticketType: true },
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
      name, value, label: OrderSourceLabels[name as keyof typeof OrderSourceLabels] || name,
    }));

    const byPaymentMethod = Array.from(byPaymentMap.entries()).map(([name, value]) => ({
      name, value, label: PaymentMethodLabels[name as keyof typeof PaymentMethodLabels] || name,
    }));

    const byTicketType = Array.from(byTicketTypeMap.values()).map(item => ({
      name: item.name, value: item.value, label: item.name,
    }));

    const byDate = Array.from(byDateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, d]) => ({ date, count: d.count, amount: Math.round(d.amount) }));

    return { bySource, byPaymentMethod, byTicketType, byDate, totalAmount: Math.round(totalAmount), totalOrders };
  } catch {
    return { bySource: [], byPaymentMethod: [], byTicketType: [], byDate: [], totalAmount: 0, totalOrders: 0 };
  }
}

async function computeTicketTypes(activityIds?: string[]): Promise<TicketTypeDetail[]> {
  const where = activityIds && activityIds.length > 0
    ? { activityId: { in: activityIds } }
    : {};

  try {
    const ticketTypes = await prisma.ticketType.findMany({ where, orderBy: { price: 'desc' } });

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

async function computeLockRecords({
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
  if (activityIds && activityIds.length > 0) where.activityId = { in: activityIds };
  if (anomalyOnly) where.isAnomaly = true;

  try {
    const [total, anomalyCount, records] = await Promise.all([
      prisma.lockRecord.count({ where }),
      prisma.lockRecord.count({ where: { ...where, isAnomaly: true } }),
      prisma.lockRecord.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ isAnomaly: 'desc' }, { lockedAt: 'desc' }],
        include: { seatAllocation: true, order: true },
      }),
    ]);

    const now = new Date();
    const detailRecords: LockRecordDetail[] = records.map(record => {
      const seat = record.seatAllocation;
      const seatInfo = seat ? `${seat.area}区${seat.row}排${seat.seatNumber}号` : '未知座位';

      let status: 'active' | 'expired' | 'released' = 'active';
      if (record.releasedAt) status = 'released';
      else if (record.expiredAt < now) status = 'expired';

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

    return { records: detailRecords, total, anomalyCount };
  } catch {
    return { records: [], total: 0, anomalyCount: 0 };
  }
}

async function computeFullSnapshot(activityIds?: string[]): Promise<DashboardSnapshotData> {
  const normIds = normalizeActivityIds(activityIds);

  const [
    overview,
    seatTrend,
    areaHeatmap,
    orderComposition,
    ticketTypes,
    lockRecordsResult,
  ] = await Promise.all([
    computeOverview(normIds.length > 0 ? normIds : undefined),
    computeSeatTrend(normIds.length > 0 ? normIds : undefined),
    computeAreaHeatmap(normIds.length > 0 ? normIds : undefined),
    computeOrderComposition(normIds.length > 0 ? normIds : undefined),
    computeTicketTypes(normIds.length > 0 ? normIds : undefined),
    computeLockRecords({ activityIds: normIds.length > 0 ? normIds : undefined, pageSize: 1000 }),
  ]);

  return {
    lastRefreshedAt: overview.lastRefreshedAt,
    occupancyRateSpec: overview.occupancyRateSpec,
    overview,
    seatTrend,
    areaHeatmap,
    orderComposition,
    ticketTypes,
    lockRecords: lockRecordsResult,
  };
}

async function findLatestValidSnapshot(activityIds?: string[]): Promise<DashboardSnapshotData | null> {
  const normIds = normalizeActivityIds(activityIds);

  try {
    const snapshots = await prisma.dashboardSnapshot.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - SNAPSHOT_CACHE_TTL_MS) },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    for (const snap of snapshots) {
      const snapIds = normalizeActivityIds(snap.activityIds as string[]);
      if (arraysEqual(normIds, snapIds)) {
        return {
          lastRefreshedAt: snap.lastRefreshedAt,
          occupancyRateSpec: JSON.parse(JSON.stringify(snap.occupancyRateSpec)) as OccupancyRateSpec,
          overview: JSON.parse(JSON.stringify(snap.overviewData)) as DashboardOverview,
          seatTrend: JSON.parse(JSON.stringify(snap.seatTrendData)) as SeatTrendDataPoint[],
          areaHeatmap: JSON.parse(JSON.stringify(snap.areaHeatmapData)) as AreaHeatmapData[],
          orderComposition: JSON.parse(JSON.stringify(snap.orderCompositionData)) as OrderComposition,
          ticketTypes: JSON.parse(JSON.stringify(snap.ticketTypesData)) as TicketTypeDetail[],
          lockRecords: JSON.parse(JSON.stringify(snap.lockRecordsData)) as { records: LockRecordDetail[]; total: number; anomalyCount: number },
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function persistSnapshot(activityIds: string[], data: DashboardSnapshotData): Promise<void> {
  try {
    await prisma.dashboardSnapshot.create({
      data: {
        activityIds,
        lastRefreshedAt: data.lastRefreshedAt,
        occupancyRateSpec: JSON.parse(JSON.stringify(data.occupancyRateSpec)),
        overviewData: JSON.parse(JSON.stringify(data.overview)),
        seatTrendData: JSON.parse(JSON.stringify(data.seatTrend)),
        areaHeatmapData: JSON.parse(JSON.stringify(data.areaHeatmap)),
        orderCompositionData: JSON.parse(JSON.stringify(data.orderComposition)),
        ticketTypesData: JSON.parse(JSON.stringify(data.ticketTypes)),
        lockRecordsData: JSON.parse(JSON.stringify(data.lockRecords)),
      },
    });
  } catch {
    // ignore persist error
  }
}

export async function getDashboardSnapshot(activityIds?: string[]): Promise<DashboardSnapshotData> {
  const normIds = normalizeActivityIds(activityIds);

  const cached = await findLatestValidSnapshot(normIds.length > 0 ? normIds : undefined);
  if (cached) return cached;

  const fresh = await computeFullSnapshot(normIds.length > 0 ? normIds : undefined);
  await persistSnapshot(normIds, fresh);
  return fresh;
}

export function filterOverviewByRole(overview: DashboardOverview, role: UserRole): DashboardOverview {
  if (role === UserRole.admin || role === UserRole.manager) {
    return overview;
  }

  if (role === UserRole.finance) {
    return {
      ...overview,
      lockedSeats: 0,
      anomalyCount: 0,
    };
  }

  return overview;
}

export function filterOrderCompositionByRole(comp: OrderComposition, role: UserRole): OrderComposition {
  if (role === UserRole.admin || role === UserRole.manager) {
    return comp;
  }

  if (role === UserRole.finance) {
    return comp;
  }

  if (role === UserRole.operator) {
    return {
      ...comp,
      byPaymentMethod: [],
    };
  }

  return comp;
}

export function filterLockRecordsByRole(
  data: { records: LockRecordDetail[]; total: number; anomalyCount: number },
  role: UserRole
): { records: LockRecordDetail[]; total: number; anomalyCount: number } {
  if (role === UserRole.admin || role === UserRole.manager) {
    return data;
  }

  if (role === UserRole.finance) {
    return { records: [], total: 0, anomalyCount: 0 };
  }

  if (role === UserRole.operator) {
    const filteredRecords = data.records.map(r => ({
      ...r,
      originalRecordUrl: null,
    }));
    return {
      ...data,
      records: filteredRecords,
    };
  }

  return data;
}

export function filterAreaHeatmapByRole(
  data: AreaHeatmapData[],
  role: UserRole
): AreaHeatmapData[] {
  if (role === UserRole.admin || role === UserRole.manager) {
    return data;
  }

  if (role === UserRole.finance) {
    return data.map(area => ({
      ...area,
      rows: area.rows.map(row => ({
        ...row,
        rate: 0,
      })),
    }));
  }

  if (role === UserRole.operator) {
    return data.map(area => {
      if (area.area === 'VIP') {
        return {
          ...area,
          rows: area.rows.map(row => ({
            ...row,
            sold: 0,
            rate: 0,
          })),
          occupancyRate: 0,
          soldSeats: 0,
        };
      }
      return area;
    });
  }

  return data;
}

export async function validateShareToken(token: string): Promise<{
  valid: boolean;
  role?: UserRole;
  activityIds?: string[];
  expiresAt?: Date;
  error?: string;
}> {
  try {
    const shareLink = await prisma.shareLink.findUnique({ where: { token } });

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

export { computeLockRecords as computeLockRecordsRaw };
