import { prisma } from './prisma';
import { REWORK_RATE_CALCULATION } from '@/types';
import { WorkorderStatus } from '@prisma/client';

const REWORK_RATE_THRESHOLD = Number(process.env.REWORK_RATE_THRESHOLD || 5);

export async function getDashboardData() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let overloadedStations = 0;
  let inventoryGaps = 0;
  let qualityAnomalies = 0;
  let completedWorkorders = 0;
  let reworkedWorkorders = 0;

  try {
    [
      overloadedStations,
      inventoryGaps,
      qualityAnomalies,
      completedWorkorders,
      reworkedWorkorders,
    ] = await Promise.all([
      prisma.station.count({
        where: {
          isActive: true,
          workorders: {
            some: {
              status: { in: [WorkorderStatus.IN_PROGRESS, WorkorderStatus.PENDING] },
            },
          },
        },
      }),
      prisma.$queryRaw<number>`
        SELECT COUNT(*)::int FROM "InventoryItem" WHERE quantity < "minThreshold"
      `.then((res: any) => Number(res[0]?.count || 0)).catch(() => 0),
      prisma.inspection.count({
        where: {
          hasAnomaly: true,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.workorder.count({
        where: {
          status: WorkorderStatus.COMPLETED,
          completedAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.workorder.count({
        where: {
          status: WorkorderStatus.COMPLETED,
          isReworked: true,
          completedAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);
  } catch (e) {
    console.warn('[dataService] 数据库查询失败，使用默认值');
  }

  const reworkRateValue = completedWorkorders > 0
    ? (reworkedWorkorders / completedWorkorders) * 100
    : 0;

  return {
    lastRefreshedAt: new Date().toISOString(),
    warnings: {
      overloadedStations,
      inventoryGaps,
      qualityAnomalies,
      reworkRateAlert: reworkRateValue > REWORK_RATE_THRESHOLD,
    },
    reworkRate: {
      value: Number(reworkRateValue.toFixed(1)),
      threshold: REWORK_RATE_THRESHOLD,
      calculation: REWORK_RATE_CALCULATION,
    },
  };
}

export async function getWorkorderTrend(days = 30) {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);

  let workorders: any[] = [];
  try {
    workorders = await prisma.workorder.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        status: true,
        isReworked: true,
        createdAt: true,
        completedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  } catch (e) {
    console.warn('[dataService] 工单趋势查询失败');
  }

  const dailyData: Record<string, { total: number; completed: number; reworked: number }> = {};

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);
    dailyData[dateStr] = { total: 0, completed: 0, reworked: 0 };
  }

  for (const wo of workorders) {
    const dateStr = new Date(wo.createdAt).toISOString().slice(0, 10);
    if (!dailyData[dateStr]) continue;

    dailyData[dateStr].total++;
    if (wo.status === WorkorderStatus.COMPLETED) {
      dailyData[dateStr].completed++;
      if (wo.isReworked) {
        dailyData[dateStr].reworked++;
      }
    }
  }

  return Object.entries(dailyData).map(([date, data]) => {
    const reworkRate = data.completed > 0
      ? Number(((data.reworked / data.completed) * 100).toFixed(1))
      : 0;
    return {
      date,
      total: data.total,
      completed: data.completed,
      reworked: data.reworked,
      reworkRate,
    };
  });
}

export async function getInventoryData() {
  let items: any[] = [];
  try {
    items = await prisma.inventoryItem.findMany({
      include: { category: true },
      orderBy: { quantity: 'desc' },
    });
  } catch (e) {
    console.warn('[dataService] 库存数据查询失败');
  }

  const categoryMap = new Map<string, { value: number; count: number }>();
  let gapValue = 0;
  let gapCount = 0;

  for (const item of items) {
    const itemValue = Number(item.unitValue) * item.quantity;
    const isGap = item.quantity < item.minThreshold;

    if (isGap) {
      gapValue += Number(item.unitValue) * item.minThreshold;
      gapCount++;
    } else {
      const existing = categoryMap.get(item.category.name);
      if (existing) {
        existing.value += itemValue;
        existing.count += item.quantity;
      } else {
        categoryMap.set(item.category.name, { value: itemValue, count: item.quantity });
      }
    }
  }

  const result = Array.from(categoryMap.entries()).map(([name, data]) => ({
    name,
    value: Math.round(data.value),
    count: data.count,
    isGap: false,
  }));

  if (gapCount > 0) {
    result.push({
      name: '库存缺口',
      value: Math.round(gapValue),
      count: gapCount,
      isGap: true,
    });
  }

  return result;
}

export async function getQuotes() {
  let quotes: any[] = [];
  try {
    quotes = await prisma.quote.findMany({
      include: {
        items: {
          include: {
            part: true,
          },
        },
        workorder: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  } catch (e) {
    console.warn('[dataService] 报价单查询失败');
  }

  return quotes.map((q: any) => ({
    id: q.id,
    quoteNo: q.quoteNo,
    customerName: q.customerName,
    vehiclePlate: q.workorder?.vehiclePlate || '',
    totalAmount: Number(q.totalAmount),
    createdAt: q.createdAt.toISOString(),
    status: q.status.toLowerCase() as 'draft' | 'approved' | 'completed',
    items: q.items.map((item: any) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      partId: item.partId || undefined,
      partSku: item.part?.sku || undefined,
    })),
  }));
}

export async function getInspections() {
  let inspections: any[] = [];
  try {
    inspections = await prisma.inspection.findMany({
      include: { workorder: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  } catch (e) {
    console.warn('[dataService] 质检记录查询失败');
  }

  return inspections.map((ins: any) => ({
    id: ins.id,
    workorderId: ins.workorderId,
    vehiclePlate: ins.vehiclePlate,
    photoUrl: ins.photoUrl,
    hasAnomaly: ins.hasAnomaly,
    annotations: ins.annotations as any[],
    createdAt: ins.createdAt.toISOString(),
    inspectorId: ins.inspectorId,
  }));
}

export async function getCurrentUser() {
  let user: any = null;
  try {
    user = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });
  } catch (e) {
    console.warn('[dataService] 用户查询失败，使用默认用户');
  }

  if (!user) {
    return {
      id: 'usr-001',
      email: 'admin@autorepair.com',
      name: '张管理',
      role: 'admin' as const,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    };
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.toLowerCase() as 'admin' | 'dispatcher' | 'inspector' | 'viewer',
    avatarUrl: user.avatarUrl || undefined,
  };
}
