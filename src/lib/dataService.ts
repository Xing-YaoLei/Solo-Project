import { prisma } from './prisma';
import { REWORK_RATE_CALCULATION } from '@/types';
import { WorkorderStatus, InsuranceStatus, TransactionType } from '@prisma/client';

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
  let insuranceRejectedCount = 0;
  let insuranceTotalCount = 0;
  let cashierAnomalyCount = 0;
  let insuranceReworkedCount = 0;

  try {
    [
      overloadedStations,
      inventoryGaps,
      qualityAnomalies,
      completedWorkorders,
      reworkedWorkorders,
      insuranceRejectedCount,
      insuranceTotalCount,
      cashierAnomalyCount,
      insuranceReworkedCount,
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
          OR: [
            { hasAnomaly: true },
            {
              workorder: {
                insuranceClaims: {
                  some: { status: InsuranceStatus.REJECTED },
                },
              },
            },
          ],
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
      prisma.insuranceClaim.count({
        where: {
          status: InsuranceStatus.REJECTED,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.insuranceClaim.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.cashierTransaction.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          OR: [
            { amount: { lt: 0 } },
            {
              type: TransactionType.INSURANCE,
              workorder: { insuranceClaims: { none: { status: InsuranceStatus.SETTLED } } },
            },
          ],
        },
      }),
      prisma.workorder.count({
        where: {
          status: WorkorderStatus.COMPLETED,
          isReworked: true,
          completedAt: { gte: thirtyDaysAgo },
          insuranceClaims: { some: {} },
        },
      }),
    ]);
  } catch (e) {
    console.warn('[dataService] 数据库查询失败，使用默认值');
  }

  const reworkRateValue = completedWorkorders > 0
    ? (reworkedWorkorders / completedWorkorders) * 100
    : 0;

  const insuranceRejectRate = insuranceTotalCount > 0
    ? Number(((insuranceRejectedCount / insuranceTotalCount) * 100).toFixed(1))
    : 0;

  const qualityAnomalyTotal = qualityAnomalies + insuranceRejectedCount + cashierAnomalyCount;

  const reworkInsuranceShare = reworkedWorkorders > 0
    ? Number(((insuranceReworkedCount / reworkedWorkorders) * 100).toFixed(1))
    : 0;

  return {
    lastRefreshedAt: new Date().toISOString(),
    warnings: {
      overloadedStations,
      inventoryGaps,
      qualityAnomalies: qualityAnomalyTotal,
      reworkRateAlert: reworkRateValue > REWORK_RATE_THRESHOLD,
      insuranceRejectRate,
      cashierAnomalyCount,
    },
    reworkRate: {
      value: Number(reworkRateValue.toFixed(1)),
      threshold: REWORK_RATE_THRESHOLD,
      calculation: REWORK_RATE_CALCULATION,
      insuranceReworkShare: reworkInsuranceShare,
      insuranceReworkedCount,
    },
  };
}

export async function getWorkorderTrend(days = 30) {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);

  let workorders: any[] = [];
  let transactions: any[] = [];
  let insuranceClaims: any[] = [];
  try {
    [workorders, transactions, insuranceClaims] = await Promise.all([
      prisma.workorder.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        select: {
          id: true,
          status: true,
          isReworked: true,
          createdAt: true,
          completedAt: true,
          insuranceClaims: { select: { id: true, status: true, materials: true } },
          cashierTransactions: { select: { id: true, amount: true, type: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.cashierTransaction.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          id: true,
          amount: true,
          type: true,
          workorderId: true,
          createdAt: true,
        },
      }),
      prisma.insuranceClaim.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          id: true,
          workorderId: true,
          status: true,
          claimAmount: true,
          approvedAmount: true,
          materials: true,
          createdAt: true,
        },
      }),
    ]);
  } catch (e) {
    console.warn('[dataService] 工单趋势查询失败');
  }

  const dailyData: Record<string, {
    total: number;
    completed: number;
    reworked: number;
    revenueCash: number;
    revenueCard: number;
    revenueInsurance: number;
    insuranceFiled: number;
    insuranceSettled: number;
    insuranceRejected: number;
    partsUsedFromInsurance: number;
  }> = {};

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);
    dailyData[dateStr] = {
      total: 0, completed: 0, reworked: 0,
      revenueCash: 0, revenueCard: 0, revenueInsurance: 0,
      insuranceFiled: 0, insuranceSettled: 0, insuranceRejected: 0,
      partsUsedFromInsurance: 0,
    };
  }

  for (const wo of workorders) {
    const dateStr = new Date(wo.createdAt).toISOString().slice(0, 10);
    if (!dailyData[dateStr]) continue;

    dailyData[dateStr].total++;
    if (wo.status === WorkorderStatus.COMPLETED) {
      dailyData[dateStr].completed++;
      if (wo.isReworked) dailyData[dateStr].reworked++;
    }
    if (wo.insuranceClaims?.some((ic: any) => ic.materials)) {
      dailyData[dateStr].partsUsedFromInsurance += wo.insuranceClaims.reduce(
        (sum: number, ic: any) => sum + (ic.materials?.length || 0),
        0
      );
    }
  }

  for (const tx of transactions) {
    const dateStr = new Date(tx.createdAt).toISOString().slice(0, 10);
    if (!dailyData[dateStr]) continue;
    const amount = Number(tx.amount) || 0;
    switch (tx.type) {
      case TransactionType.CASH:
        dailyData[dateStr].revenueCash += amount;
        break;
      case TransactionType.CARD:
        dailyData[dateStr].revenueCard += amount;
        break;
      case TransactionType.INSURANCE:
        dailyData[dateStr].revenueInsurance += amount;
        break;
    }
  }

  for (const ic of insuranceClaims) {
    const dateStr = new Date(ic.createdAt).toISOString().slice(0, 10);
    if (!dailyData[dateStr]) continue;
    dailyData[dateStr].insuranceFiled++;
    if (ic.status === InsuranceStatus.SETTLED) dailyData[dateStr].insuranceSettled++;
    if (ic.status === InsuranceStatus.REJECTED) dailyData[dateStr].insuranceRejected++;
  }

  return Object.entries(dailyData).map(([date, data]) => {
    const reworkRate = data.completed > 0
      ? Number(((data.reworked / data.completed) * 100).toFixed(1))
      : 0;
    const totalRevenue = data.revenueCash + data.revenueCard + data.revenueInsurance;
    return {
      date,
      total: data.total,
      completed: data.completed,
      reworked: data.reworked,
      reworkRate,
      revenue: Math.round(totalRevenue),
      revenueBreakdown: {
        cash: Math.round(data.revenueCash),
        card: Math.round(data.revenueCard),
        insurance: Math.round(data.revenueInsurance),
      },
      insurance: {
        filed: data.insuranceFiled,
        settled: data.insuranceSettled,
        rejected: data.insuranceRejected,
      },
      partsFromInsurance: data.partsUsedFromInsurance,
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
            part: {
              include: { category: true },
            },
          },
        },
        workorder: {
          include: {
            cashierTransactions: true,
            insuranceClaims: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  } catch (e) {
    console.warn('[dataService] 报价单查询失败');
  }

  return quotes.map((q: any) => {
    const workorder = q.workorder;
    const cashierTxns = workorder?.cashierTransactions || [];
    const insuranceClaims = workorder?.insuranceClaims || [];

    const totalPaid = cashierTxns.reduce(
      (sum: number, tx: any) => sum + (Number(tx.amount) || 0),
      0
    );
    const insuranceClaimTotal = insuranceClaims.reduce(
      (sum: number, ic: any) => sum + (Number(ic.claimAmount) || 0),
      0
    );
    const insuranceSettledAmount = insuranceClaims.reduce((sum: number, ic: any) => {
      if (ic.status === InsuranceStatus.SETTLED) {
        return sum + (Number(ic.approvedAmount) || 0);
      }
      return sum;
    }, 0);

    const partTraceability: any[] = [];
    for (const item of q.items || []) {
      if (item.part) {
        partTraceability.push({
          quoteItemId: item.id,
          description: item.description,
          partId: item.part.id,
          partSku: item.part.sku,
          partName: item.part.name,
          category: item.part.category?.name,
          unitValue: Number(item.part.unitValue),
          quoteUnitPrice: Number(item.unitPrice),
          markup: Number(item.unitPrice) > Number(item.part.unitValue)
            ? Number((((Number(item.unitPrice) - Number(item.part.unitValue)) / Number(item.part.unitValue)) * 100).toFixed(1))
            : 0,
          inStock: item.part.quantity,
          minThreshold: item.part.minThreshold,
          isGap: item.part.quantity < item.part.minThreshold,
        });
      }
    }

    const insuranceMaterialsUsed = insuranceClaims.reduce((all: any[], ic: any) => {
      return [...all, ...((ic.materials as any[]) || [])];
    }, []);

    return {
      id: q.id,
      quoteNo: q.quoteNo,
      customerName: q.customerName,
      vehiclePlate: workorder?.vehiclePlate || '',
      workorderId: workorder?.id,
      totalAmount: Number(q.totalAmount),
      totalPaid,
      balance: Number(q.totalAmount) - totalPaid,
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
      cashier: {
        transactions: cashierTxns.map((tx: any) => ({
          id: tx.id,
          amount: Number(tx.amount),
          type: tx.type.toLowerCase(),
          reference: tx.reference,
          createdAt: tx.createdAt.toISOString(),
        })),
        totalPaid,
      },
      insurance: {
        claims: insuranceClaims.map((ic: any) => ({
          id: ic.id,
          policyNo: ic.policyNo,
          claimAmount: Number(ic.claimAmount),
          approvedAmount: Number(ic.approvedAmount),
          status: ic.status.toLowerCase(),
          materials: ic.materials,
        })),
        totalClaim: insuranceClaimTotal,
        settledAmount: insuranceSettledAmount,
      },
      partTraceability,
      insuranceMaterialsUsed,
    };
  });
}

export async function getInspections() {
  let inspections: any[] = [];
  try {
    inspections = await prisma.inspection.findMany({
      include: {
        workorder: {
          include: {
            insuranceClaims: true,
            cashierTransactions: true,
            quote: {
              include: {
                items: { include: { part: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  } catch (e) {
    console.warn('[dataService] 质检记录查询失败');
  }

  return inspections.map((ins: any) => {
    const workorder = ins.workorder;
    const insuranceClaims = workorder?.insuranceClaims || [];
    const quote = workorder?.quote;
    const quoteItems = quote?.items || [];
    const cashierTxns = workorder?.cashierTransactions || [];

    const insuranceMaterialsWithAnomaly: any[] = [];
    for (const ic of insuranceClaims) {
      if (ic.status === InsuranceStatus.REJECTED) {
        insuranceMaterialsWithAnomaly.push(...((ic.materials as any[]) || []));
      }
    }

    const partsUsed = quoteItems
      .filter((qi: any) => qi.part)
      .map((qi: any) => ({
        partId: qi.part.id,
        sku: qi.part.sku,
        name: qi.part.name,
        quantity: qi.quantity,
        unitPrice: Number(qi.unitPrice),
        inStock: qi.part.quantity,
        minThreshold: qi.part.minThreshold,
        isStockGap: qi.part.quantity < qi.part.minThreshold,
      }));

    const isReworked = workorder?.isReworked || false;
    const hasInsuranceRejection = insuranceClaims.some(
      (ic: any) => ic.status === InsuranceStatus.REJECTED
    );
    const hasStockGapParts = partsUsed.some((p: any) => p.isStockGap);

    const anomalySources: string[] = [];
    if (ins.hasAnomaly) anomalySources.push('image');
    if (isReworked) anomalySources.push('rework');
    if (hasInsuranceRejection) anomalySources.push('insurance_rejected');
    if (hasStockGapParts) anomalySources.push('stock_gap');

    const cashierPaid = cashierTxns.reduce(
      (sum: number, tx: any) => sum + (Number(tx.amount) || 0),
      0
    );

    return {
      id: ins.id,
      workorderId: ins.workorderId,
      vehiclePlate: ins.vehiclePlate,
      photoUrl: ins.photoUrl,
      hasAnomaly: ins.hasAnomaly || isReworked || hasInsuranceRejection,
      anomalySources,
      annotations: ins.annotations as any[],
      createdAt: ins.createdAt.toISOString(),
      inspectorId: ins.inspectorId,
      isReworked,
      insurance: {
        claims: insuranceClaims.map((ic: any) => ({
          id: ic.id,
          policyNo: ic.policyNo,
          status: ic.status.toLowerCase(),
          claimAmount: Number(ic.claimAmount),
          approvedAmount: Number(ic.approvedAmount),
          materials: ic.materials,
        })),
        rejectedMaterials: insuranceMaterialsWithAnomaly,
        hasRejection: hasInsuranceRejection,
      },
      partsUsed,
      hasStockGapParts,
      cashier: {
        totalPaid: cashierPaid,
        txCount: cashierTxns.length,
      },
    };
  });
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
