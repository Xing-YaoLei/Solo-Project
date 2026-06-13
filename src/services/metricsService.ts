import { prisma } from '@/lib/prisma';
import {
  DashboardMetrics,
  FunnelData,
  TechnicianRank,
  ConsumptionData,
  PhotoFunnelData,
  InventoryRank,
  FollowupTrend,
  TechnicianMetrics,
  HandOrder,
  InventoryUsage,
} from '@/types';
import {
  getDashboardMetrics,
  getFunnelData,
  getTechnicianRank,
  getConsumptionData,
  getPhotoFunnelData,
  getInventoryRank,
  getFollowupTrend,
  getTechnicianMetrics,
  generateMockHandOrders,
} from './mockData';

const USE_MOCK = true;

export async function calculateDashboardMetrics(
  startDate?: Date,
  endDate?: Date
): Promise<DashboardMetrics> {
  if (USE_MOCK) return getDashboardMetrics();

  const where = startDate && endDate ? {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  } : {};

  const orders = await prisma.handOrder.findMany({
    where,
    include: { transactions: true },
  });

  const totalRevenue = orders.reduce(
    (sum: number, order: any) => sum + order.transactions.reduce((s: number, t: any) => s + t.amount.toNumber(), 0),
    0
  );
  const paidOrders = orders.filter((o: any) => o.status === 'PAID' || o.status === 'REVIEWED').length;
  const totalOrders = orders.length;
  const avgOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;
  const completionRate = totalOrders > 0 ? paidOrders / totalOrders : 0;

  return {
    todayRevenue: totalRevenue,
    todayOrders: totalOrders,
    avgOrderValue,
    completionRate,
    yoyGrowth: 0.125,
  };
}

export async function calculateFunnelData(
  startDate?: Date,
  endDate?: Date
): Promise<FunnelData[]> {
  if (USE_MOCK) return getFunnelData();

  const where = startDate && endDate ? {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  } : {};

  const orders = await prisma.handOrder.findMany({ where });

  const stages = [
    { status: 'CREATED', label: '开单' },
    { status: 'IN_SERVICE', label: '服务中' },
    { status: 'COMPLETED', label: '服务完成' },
    { status: 'PAID', label: '已支付' },
    { status: 'REVIEWED', label: '已点评' },
  ];

  const result: FunnelData[] = [];
  let prevValue = orders.length;

  stages.forEach((stage, index) => {
    const value = orders.filter((o: any) => {
      const statusIndex = ['CREATED', 'IN_SERVICE', 'COMPLETED', 'PAID', 'REVIEWED'].indexOf(o.status);
      return statusIndex >= index;
    }).length;

    result.push({
      stage: stage.label,
      value,
      conversionRate: prevValue > 0 ? value / prevValue : 0,
    });
    prevValue = value;
  });

  return result;
}

export async function getTechnicianRanking(
  startDate?: Date,
  endDate?: Date,
  sortBy: 'revenue' | 'orders' | 'rating' = 'revenue'
): Promise<TechnicianRank[]> {
  if (USE_MOCK) return getTechnicianRank();

  const where = startDate && endDate ? {
    transactionTime: {
      gte: startDate,
      lte: endDate,
    },
  } : {};

  const technicians = await prisma.user.findMany({
    where: { role: 'TECHNICIAN' },
    include: {
      orders: {
        include: {
          transactions: true,
          review: true,
        },
      },
    },
  });

  const ranks: TechnicianRank[] = technicians.map((tech: any) => {
    const techOrders = tech.orders.filter((o: any) => {
      if (!where.transactionTime) return true;
      return o.transactions.some(
        (t: any) => t.transactionTime >= where.transactionTime!.gte && t.transactionTime <= where.transactionTime!.lte
      );
    });

    const totalRevenue = techOrders.reduce(
      (sum: number, o: any) => sum + o.transactions.reduce((s: number, t: any) => s + t.amount.toNumber(), 0),
      0
    );
    const avgRating = techOrders.length > 0
      ? techOrders.reduce((sum: number, o: any) => sum + (o.review?.rating || 0), 0) / techOrders.length
      : 0;

    return {
      id: tech.id,
      name: tech.name,
      avatarUrl: tech.avatarUrl || undefined,
      totalRevenue,
      orderCount: techOrders.length,
      avgRating,
    };
  });

  ranks.sort((a, b) => {
    if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
    if (sortBy === 'orders') return b.orderCount - a.orderCount;
    return b.avgRating - a.avgRating;
  });

  return ranks;
}

export async function getConsumptionDistribution(
  dimension: 'item' | 'amount' | 'time',
  startDate?: Date,
  endDate?: Date
): Promise<ConsumptionData[]> {
  if (USE_MOCK) return getConsumptionData(dimension);

  const where = startDate && endDate ? {
    transactionTime: {
      gte: startDate,
      lte: endDate,
    },
  } : {};

  const transactions = await prisma.transaction.findMany({ where });

  if (dimension === 'item') {
    const grouped: Record<string, number> = {};
    transactions.forEach((t: any) => {
      grouped[t.serviceItem] = (grouped[t.serviceItem] || 0) + 1;
    });
    return Object.entries(grouped).map(([name, count]) => ({ name, value: count, count }));
  }

  if (dimension === 'amount') {
    const ranges = [
      { name: '0-500元', min: 0, max: 500 },
      { name: '500-1000元', min: 500, max: 1000 },
      { name: '1000-1500元', min: 1000, max: 1500 },
      { name: '1500-2000元', min: 1500, max: 2000 },
      { name: '2000元以上', min: 2000, max: Infinity },
    ];

    return ranges.map(range => {
      const count = transactions.filter(
        (t: any) => t.amount.toNumber() >= range.min && t.amount.toNumber() < range.max
      ).length;
      return { name: range.name, value: count, count };
    });
  }

  const timeRanges = [
    { name: '10:00前', min: 0, max: 10 },
    { name: '10:00-12:00', min: 10, max: 12 },
    { name: '12:00-14:00', min: 12, max: 14 },
    { name: '14:00-16:00', min: 14, max: 16 },
    { name: '16:00-18:00', min: 16, max: 18 },
    { name: '18:00后', min: 18, max: 24 },
  ];

  return timeRanges.map(range => {
    const count = transactions.filter((t: any) => {
      const hour = t.transactionTime.getHours();
      return hour >= range.min && hour < range.max;
    }).length;
    return { name: range.name, value: count, count };
  });
}

export async function getPhotoFunnel(
  startDate?: Date,
  endDate?: Date
): Promise<PhotoFunnelData[]> {
  if (USE_MOCK) return getPhotoFunnelData();

  const where = startDate && endDate ? {
    reviewedAt: {
      gte: startDate,
      lte: endDate,
    },
  } : {};

  const reviews = await prisma.review.findMany({ where });

  return [
    { stage: '服务订单', value: reviews.length },
    { stage: '上传术前照', value: reviews.filter((r: any) => r.hasBeforePhoto).length },
    { stage: '上传术后照', value: reviews.filter((r: any) => r.hasAfterPhoto).length },
    { stage: '形成对比案例', value: reviews.filter((r: any) => r.hasBeforePhoto && r.hasAfterPhoto).length },
  ];
}

export async function getInventoryRanking(
  startDate?: Date,
  endDate?: Date,
  limit = 10
): Promise<InventoryRank[]> {
  if (USE_MOCK) return getInventoryRank();

  const where = startDate && endDate ? {
    order: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  } : {};

  const usages = await prisma.inventoryUsage.findMany({
    where,
    include: { inventory: true },
  });

  const grouped: Record<string, { product: any; totalUsed: number; abnormalCount: number }> = {};

  usages.forEach((usage: any) => {
    const invId = usage.inventoryId;
    if (!grouped[invId]) {
      grouped[invId] = {
        product: usage.inventory,
        totalUsed: 0,
        abnormalCount: 0,
      };
    }
    grouped[invId].totalUsed += usage.quantity.toNumber();
    if (usage.isAbnormal) {
      grouped[invId].abnormalCount += 1;
    }
  });

  const result: InventoryRank[] = Object.values(grouped).map(item => ({
    id: item.product.id,
    productName: item.product.productName,
    category: item.product.category,
    totalUsed: item.totalUsed,
    abnormalCount: item.abnormalCount,
    abnormalRate: item.totalUsed > 0 ? item.abnormalCount / item.totalUsed : 0,
  }));

  result.sort((a, b) => b.totalUsed - a.totalUsed);
  return result.slice(0, limit);
}

export async function getFollowupScriptTrend(
  startDate?: Date,
  endDate?: Date
): Promise<FollowupTrend[]> {
  if (USE_MOCK) return getFollowupTrend();

  const where = startDate && endDate ? {
    reviewedAt: {
      gte: startDate,
      lte: endDate,
    },
    followUpScript: { not: null },
  } : { followUpScript: { not: null } };

  const reviews = await prisma.review.findMany({ where });

  const grouped: Record<string, Record<string, { total: number; responded: number }>> = {};

  reviews.forEach((review: any) => {
    const date = review.reviewedAt.toISOString().slice(5, 10);
    const script = review.followUpScript!;
    if (!grouped[date]) grouped[date] = {};
    if (!grouped[date][script]) grouped[date][script] = { total: 0, responded: 0 };
    grouped[date][script].total += 1;
    if (review.responded) grouped[date][script].responded += 1;
  });

  const result: FollowupTrend[] = [];
  Object.entries(grouped).forEach(([date, scripts]) => {
    Object.entries(scripts).forEach(([script, data]) => {
      result.push({
        date,
        script,
        responseRate: data.total > 0 ? data.responded / data.total : 0,
        count: data.total,
      });
    });
  });

  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

export async function getTechnicianPersonalMetrics(
  technicianId: string,
  startDate?: Date,
  endDate?: Date
): Promise<TechnicianMetrics> {
  if (USE_MOCK) return getTechnicianMetrics(technicianId);

  const where = startDate && endDate ? {
    technicianId,
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  } : { technicianId };

  const orders = await prisma.handOrder.findMany({
    where,
    include: {
      transactions: true,
      review: true,
    },
  });

  const totalRevenue = orders.reduce(
    (sum: number, o: any) => sum + o.transactions.reduce((s: number, t: any) => s + t.amount.toNumber(), 0),
    0
  );
  const completedOrders = orders.filter((o: any) => o.status !== 'CREATED').length;
  const avgRating = orders.length > 0
    ? orders.reduce((sum: number, o: any) => sum + (o.review?.rating || 0), 0) / orders.length
    : 0;
  const completionRate = orders.length > 0 ? completedOrders / orders.length : 0;

  return {
    totalRevenue,
    orderCount: orders.length,
    avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    avgRating,
    completionRate,
  };
}

export async function getTechnicianOrders(
  technicianId: string,
  startDate?: Date,
  endDate?: Date
): Promise<HandOrder[]> {
  if (USE_MOCK) {
    const allOrders = generateMockHandOrders();
    return allOrders.filter(o => o.technicianId === technicianId);
  }

  const where = startDate && endDate ? {
    technicianId,
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  } : { technicianId };

  const orders = await prisma.handOrder.findMany({
    where,
    include: {
      technician: true,
      transactions: true,
      inventoryItems: { include: { inventory: true } },
      review: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders as unknown as HandOrder[];
}

export async function markInventoryAbnormal(
  usageId: string,
  isAbnormal: boolean,
  note?: string,
  notedBy?: string
): Promise<InventoryUsage> {
  if (USE_MOCK) {
    return {
      id: usageId,
      orderId: '',
      inventoryId: '',
      quantity: 0,
      isAbnormal,
      abnormalNote: note,
      notedBy,
      notedAt: new Date(),
    };
  }

  const updated = await prisma.inventoryUsage.update({
    where: { id: usageId },
    data: {
      isAbnormal,
      abnormalNote: note,
      notedBy,
      notedAt: new Date(),
    },
    include: { inventory: true },
  });

  return updated as unknown as InventoryUsage;
}
