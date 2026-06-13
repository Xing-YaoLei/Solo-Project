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
} from './mockData';
import { CONFIG } from './config';

const STATUS_ORDER = ['CREATED', 'IN_SERVICE', 'COMPLETED', 'PAID', 'REVIEWED'];

export async function calculateDashboardMetrics(
  startDate?: Date,
  endDate?: Date
): Promise<DashboardMetrics> {
  if (CONFIG.USE_MOCK) return getDashboardMetrics();

  const { prisma } = await import('@/lib/prisma');
  const where: any = {};
  if (startDate && endDate) {
    where.createdAt = { gte: startDate, lte: endDate };
  }

  const orders = await prisma.handOrder.findMany({
    where,
    include: { transactions: true },
  });

  const totalRevenue = orders.reduce(
    (sum: number, o: any) => sum + o.transactions.reduce((s: number, t: any) => s + t.amount.toNumber(), 0),
    0
  );
  const paidOrders = orders.filter((o: any) => o.status === 'PAID' || o.status === 'REVIEWED').length;
  const totalOrders = orders.length;

  return {
    todayRevenue: totalRevenue,
    todayOrders: totalOrders,
    avgOrderValue: paidOrders > 0 ? totalRevenue / paidOrders : 0,
    completionRate: totalOrders > 0 ? paidOrders / totalOrders : 0,
    yoyGrowth: 0.125,
  };
}

export async function calculateFunnelData(
  startDate?: Date,
  endDate?: Date
): Promise<FunnelData[]> {
  if (CONFIG.USE_MOCK) return getFunnelData();

  const { prisma } = await import('@/lib/prisma');
  const where: any = {};
  if (startDate && endDate) {
    where.createdAt = { gte: startDate, lte: endDate };
  }
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
    const value = orders.filter((o: any) => STATUS_ORDER.indexOf(o.status) >= index).length;
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
  if (CONFIG.USE_MOCK) {
    const ranks = getTechnicianRank();
    if (sortBy === 'orders') return [...ranks].sort((a, b) => b.orderCount - a.orderCount);
    if (sortBy === 'rating') return [...ranks].sort((a, b) => b.avgRating - a.avgRating);
    return ranks;
  }

  const { prisma } = await import('@/lib/prisma');
  const where: any = {};
  if (startDate && endDate) {
    where.transactions = {
      some: { transactionTime: { gte: startDate, lte: endDate } },
    };
  }

  const technicians = await prisma.user.findMany({
    where: { role: 'TECHNICIAN' },
    include: {
      orders: {
        include: {
          transactions: { include: { review: true } },
        },
      },
    },
  });

  return technicians.map((tech: any) => {
    const totalRevenue = tech.orders.reduce(
      (sum: number, o: any) => sum + o.transactions.reduce((s: number, t: any) => s + t.amount.toNumber(), 0),
      0
    );
    const avgRating = tech.orders.length > 0
      ? tech.orders.reduce((sum: number, o: any) => {
          const review = o.transactions.find((t: any) => t.review)?.review;
          return sum + (review?.rating || 0);
        }, 0) / tech.orders.length
      : 0;
    return {
      id: tech.id,
      name: tech.name,
      totalRevenue,
      orderCount: tech.orders.length,
      avgRating,
    };
  }).sort((a, b) => {
    if (sortBy === 'orders') return b.orderCount - a.orderCount;
    if (sortBy === 'rating') return b.avgRating - a.avgRating;
    return b.totalRevenue - a.totalRevenue;
  });
}

export async function getConsumptionDistribution(
  dimension: 'item' | 'amount' | 'time' = 'item',
  startDate?: Date,
  endDate?: Date
): Promise<ConsumptionData[]> {
  if (CONFIG.USE_MOCK) return getConsumptionData(dimension);

  const { prisma } = await import('@/lib/prisma');
  const where: any = {};
  if (startDate && endDate) {
    where.transactionTime = { gte: startDate, lte: endDate };
  }
  const transactions = await prisma.transaction.findMany({ where });

  if (dimension === 'item') {
    const grouped: Record<string, number> = {};
    transactions.forEach((t: any) => {
      grouped[t.serviceItem] = (grouped[t.serviceItem] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([name, count]) => ({ name, value: count, count }))
      .sort((a, b) => b.value - a.value);
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
        (t: any) => {
          const amt = t.amount.toNumber();
          return amt >= range.min && amt < range.max;
        }
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
  if (CONFIG.USE_MOCK) return getPhotoFunnelData();

  const { prisma } = await import('@/lib/prisma');
  const where: any = {};
  if (startDate && endDate) {
    where.reviewedAt = { gte: startDate, lte: endDate };
  }
  const reviews = await prisma.review.findMany({ where });

  const stages = [
    { stage: '服务订单', value: reviews.length },
    { stage: '上传术前照', value: reviews.filter((r: any) => r.hasBeforePhoto).length },
    { stage: '上传术后照', value: reviews.filter((r: any) => r.hasAfterPhoto).length },
    { stage: '形成对比案例', value: reviews.filter((r: any) => r.hasBeforePhoto && r.hasAfterPhoto).length },
  ];

  return stages.map((item, index) => ({
    ...item,
    conversionRate: index === 0 ? 1 : stages[index - 1].value > 0 ? item.value / stages[index - 1].value : 0,
  }));
}

export async function getInventoryRanking(
  startDate?: Date,
  endDate?: Date,
  limit = 10
): Promise<InventoryRank[]> {
  if (CONFIG.USE_MOCK) return getInventoryRank().slice(0, limit);

  const { prisma } = await import('@/lib/prisma');
  const where: any = {};

  const usages = await prisma.inventoryUsage.findMany({
    where,
    include: { inventory: true },
  });

  const grouped: Record<string, { product: any; totalUsed: number; abnormalCount: number }> = {};
  usages.forEach((usage: any) => {
    const invId = usage.inventoryId;
    if (!grouped[invId]) {
      grouped[invId] = { product: usage.inventory, totalUsed: 0, abnormalCount: 0 };
    }
    grouped[invId].totalUsed += usage.quantity.toNumber();
    if (usage.isAbnormal) grouped[invId].abnormalCount += 1;
  });

  return Object.values(grouped)
    .map(item => ({
      id: item.product.id,
      productName: item.product.productName,
      category: item.product.category,
      totalUsed: item.totalUsed,
      abnormalCount: item.abnormalCount,
      abnormalRate: item.totalUsed > 0 ? item.abnormalCount / item.totalUsed : 0,
    }))
    .sort((a, b) => b.totalUsed - a.totalUsed)
    .slice(0, limit);
}

export async function getFollowupScriptTrend(
  startDate?: Date,
  endDate?: Date
): Promise<FollowupTrend[]> {
  if (CONFIG.USE_MOCK) return getFollowupTrend();

  const { prisma } = await import('@/lib/prisma');
  const where: any = { NOT: [{ followUpScript: null }, { followUpScript: '' }] };
  if (startDate && endDate) {
    where.reviewedAt = { gte: startDate, lte: endDate };
  }
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

export async function calculateTechnicianMetrics(
  technicianId: string,
  startDate?: Date,
  endDate?: Date
): Promise<TechnicianMetrics> {
  if (CONFIG.USE_MOCK) return getTechnicianMetrics(technicianId);

  const { prisma } = await import('@/lib/prisma');
  const where: any = { technicianId };
  if (startDate && endDate) {
    where.createdAt = { gte: startDate, lte: endDate };
  }

  const orders = await prisma.handOrder.findMany({
    where,
    include: { transactions: { include: { review: true } } },
  });

  const totalRevenue = orders.reduce(
    (sum: number, o: any) => sum + o.transactions.reduce((s: number, t: any) => s + t.amount.toNumber(), 0),
    0
  );
  const completedOrders = orders.filter((o: any) => o.status !== 'CREATED').length;
  const avgRating = orders.length > 0
    ? orders.reduce((sum: number, o: any) => {
        const review = o.transactions.find((t: any) => t.review)?.review;
        return sum + (review?.rating || 0);
      }, 0) / orders.length
    : 0;

  return {
    totalRevenue,
    orderCount: orders.length,
    avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    avgRating,
    completionRate: orders.length > 0 ? completedOrders / orders.length : 0,
  };
}

export async function getTechnicianOrders(
  technicianId: string,
  startDate?: Date,
  endDate?: Date
): Promise<HandOrder[]> {
  if (CONFIG.USE_MOCK) {
    const data = (await import('./mockData')).generateMockHandOrders();
    return data.filter(o => o.technicianId === technicianId);
  }

  const { prisma } = await import('@/lib/prisma');
  const where: any = { technicianId };
  if (startDate && endDate) {
    where.createdAt = { gte: startDate, lte: endDate };
  }

  const raw = await prisma.handOrder.findMany({
    where,
    include: {
      technician: true,
      transactions: { include: { review: true } },
      inventoryItems: { include: { inventory: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return raw.map((o: any) => ({
    ...o,
    totalAmount: o.totalAmount.toNumber(),
    transactions: o.transactions.map((t: any) => ({ ...t, amount: t.amount.toNumber() })),
    inventoryItems: o.inventoryItems.map((u: any) => ({
      ...u,
      quantity: u.quantity.toNumber(),
    })),
  }));
}

export async function markInventoryAbnormal(
  usageId: string,
  isAbnormal: boolean,
  note?: string,
  notedBy?: string
): Promise<void> {
  if (CONFIG.USE_MOCK) {
    const { mockStore } = await import('./mockStore');
    mockStore.updateInventoryUsage(usageId, {
      isAbnormal,
      abnormalNote: note,
      notedBy,
      notedAt: new Date(),
    });
    return;
  }

  const { prisma } = await import('@/lib/prisma');
  await prisma.inventoryUsage.update({
    where: { id: usageId },
    data: {
      isAbnormal,
      abnormalNote: note ?? null,
      notedBy: notedBy ?? null,
      notedAt: new Date(),
    },
  });
}

export const getTechnicianPersonalMetrics = calculateTechnicianMetrics;
