import { prisma } from "./prisma";
import { Decimal } from "@prisma/client/runtime/library";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

async function calculateReworkRate(startDate: Date, endDate: Date): Promise<number> {
  const totalOrders = await prisma.workOrder.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: "completed",
    },
  });

  if (totalOrders === 0) return 0;

  const reworkOrders = await prisma.workOrder.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: "completed",
      isRework: true,
    },
  });

  return reworkOrders / totalOrders;
}

export async function getOverviewDataFromDB() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const totalWorkOrders = await prisma.workOrder.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: now,
      },
    },
  });

  const completedOrders = await prisma.workOrder.findMany({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: now,
      },
      status: "completed",
      startedAt: { not: null },
      completedAt: { not: null },
    },
    select: {
      startedAt: true,
      completedAt: true,
    },
  });

  let avgRepairDuration = 0;
  if (completedOrders.length > 0) {
    const totalHours = completedOrders.reduce((sum, order) => {
      if (order.startedAt && order.completedAt) {
        return sum + (order.completedAt.getTime() - order.startedAt.getTime()) / (1000 * 60 * 60);
      }
      return sum;
    }, 0);
    avgRepairDuration = Number((totalHours / completedOrders.length).toFixed(1));
  }

  const reworkRate = await calculateReworkRate(startOfMonth, now);

  const totalStations = await prisma.workStation.count({
    where: { isActive: true },
  });

  let stationUtilization = 0;
  if (totalStations > 0) {
    const stationOccupancy = await prisma.workOrder.groupBy({
      by: ["stationId"],
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: now,
        },
        stationId: { not: null },
      },
      _count: {
        stationId: true,
      },
    });

    const daysInMonth = Math.ceil(
      (now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalPossibleSlots = totalStations * daysInMonth * 8;
    const occupiedSlots = stationOccupancy.reduce(
      (sum, s) => sum + (s._count.stationId || 0),
      0
    );
    stationUtilization = Math.min(occupiedSlots / totalPossibleSlots, 1);
  }

  return {
    totalWorkOrders,
    avgRepairDuration,
    reworkRate: Number(reworkRate.toFixed(3)),
    stationUtilization: Number(stationUtilization.toFixed(3)),
    lastUpdated: new Date().toISOString(),
  };
}

export async function getQuotationTrendFromDB(period: "day" | "week" | "month" = "day") {
  const now = new Date();
  let startDate: Date;
  let groupByFormat: string;

  if (period === "day") {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    groupByFormat = "day";
  } else if (period === "week") {
    startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
    groupByFormat = "week";
  } else {
    startDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
    groupByFormat = "month";
  }

  const orders = await prisma.workOrder.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: now,
      },
    },
    select: {
      createdAt: true,
      totalAmount: true,
    },
  });

  const groupedData: Record<string, { count: number; total: Decimal }> = {};

  orders.forEach((order) => {
    let key: string;
    const d = order.createdAt;
    if (groupByFormat === "day") {
      key = formatDate(d);
    } else if (groupByFormat === "week") {
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      key = formatDate(weekStart);
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }

    if (!groupedData[key]) {
      groupedData[key] = { count: 0, total: new Decimal(0) };
    }
    groupedData[key].count++;
    groupedData[key].total = groupedData[key].total.add(order.totalAmount);
  });

  const data = Object.entries(groupedData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({
      date,
      orderCount: values.count,
      totalAmount: Number(values.total.toFixed(2)),
      avgAmount: values.count > 0 ? Number(values.total.div(values.count).toFixed(2)) : 0,
    }));

  return {
    data,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getInspectionDataFromDB() {
  const now = new Date();
  const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const inspections = await prisma.inspectionPhoto.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: now,
      },
    },
    select: {
      inspectionType: true,
      isPassed: true,
    },
  });

  const total = inspections.length;
  const passed = inspections.filter((i) => i.isPassed).length;
  const failed = total - passed;

  const issueCounts: Record<string, number> = {};
  inspections
    .filter((i) => !i.isPassed)
    .forEach((i) => {
      const type = i.inspectionType || "其他";
      issueCounts[type] = (issueCounts[type] || 0) + 1;
    });

  const issues = Object.entries(issueCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => ({
      type,
      count,
      percentage: failed > 0 ? Number((count / failed).toFixed(3)) : 0,
    }));

  return {
    summary: {
      total,
      passed,
      failed,
      passRate: total > 0 ? Number((passed / total).toFixed(3)) : 0,
    },
    issues,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getVehicleRecordsFromDB(page: number = 1, pageSize: number = 10) {
  const skip = (page - 1) * pageSize;

  const vehicles = await prisma.vehicle.findMany({
    skip,
    take: pageSize,
    include: {
      workOrders: {
        include: {
          parts: true,
          insuranceDoc: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalCount = await prisma.vehicle.count();

  const data = vehicles.map((vehicle) => {
    const totalAmount = vehicle.workOrders.reduce(
      (sum, order) => sum.add(order.totalAmount),
      new Decimal(0)
    );

    const lastOrder = vehicle.workOrders[0];
    const lastServiceDate = lastOrder ? formatDate(lastOrder.createdAt) : "-";

    const parts = vehicle.workOrders.flatMap((order) =>
      order.parts.map((p) => ({
        partId: p.partId,
        partName: p.partName,
        partCode: p.partCode || "",
        quantity: p.quantity,
        unitPrice: Number(p.unitPrice.toFixed(2)),
        subtotal: Number(p.subtotal.toFixed(2)),
        usedDate: formatDate(p.usedAt),
      }))
    );

    const insuranceDocs = vehicle.workOrders
      .filter((order: any) => order.insuranceDoc)
      .map((order: any) => ({
        id: order.insuranceDoc.id,
        orderId: order.insuranceDoc.orderId,
        company: order.insuranceDoc.company,
        policyNumber: order.insuranceDoc.policyNumber,
        claimAmount: Number(order.insuranceDoc.claimAmount.toFixed(2)),
        claimStatus: order.insuranceDoc.claimStatus,
        filedDate: order.insuranceDoc.filedAt ? formatDate(order.insuranceDoc.filedAt) : "",
        settledDate: order.insuranceDoc.settledAt ? formatDate(order.insuranceDoc.settledAt) : undefined,
      }));

    return {
      id: vehicle.id,
      plateNumber: vehicle.plateNumber,
      vehicleModel: vehicle.model,
      ownerName: vehicle.ownerName,
      ownerPhone: vehicle.ownerPhone,
      vin: vehicle.vin || "",
      mileage: vehicle.mileage || 0,
      lastServiceDate,
      serviceCount: vehicle.workOrders.length,
      totalAmount: Number(totalAmount.toFixed(2)),
      parts,
      insuranceDocs,
    };
  });

  return {
    data,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
    lastUpdated: new Date().toISOString(),
  };
}

export async function getDiagnosisDataFromDB() {
  const now = new Date();
  const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const abnormalItems = await prisma.diagnosisResult.findMany({
    where: {
      isAbnormal: true,
      createdAt: {
        gte: startDate,
        lte: now,
      },
    },
    include: {
      workOrder: {
        include: {
          vehicle: true,
          technician: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const items = abnormalItems.map((item) => ({
    id: item.id,
    date: formatDate(item.createdAt),
    vehiclePlate: item.workOrder.vehicle.plateNumber,
    diagnosisItem: item.itemName,
    result: item.result,
    severity: item.severity,
    isRework: item.workOrder.isRework,
    technician: item.workOrder.technician?.name || "未分配",
  }));

  const trendData: Record<string, { abnormal: number; rework: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    trendData[formatDate(d)] = { abnormal: 0, rework: 0 };
  }

  abnormalItems.forEach((item) => {
    const dateKey = formatDate(item.createdAt);
    if (trendData[dateKey]) {
      trendData[dateKey].abnormal++;
      if (item.workOrder.isRework) {
        trendData[dateKey].rework++;
      }
    }
  });

  const trend = Object.entries(trendData).map(([date, values]) => ({
    date,
    abnormalCount: values.abnormal,
    reworkCount: values.rework,
  }));

  return {
    abnormalItems: items,
    trend,
    lastUpdated: new Date().toISOString(),
  };
}

export async function createShareLinkInDB(
  role: string,
  expiresInDays?: number,
  scope?: string[]
) {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  let expiresAt: Date | undefined;
  if (expiresInDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  }

  const defaultScopes = [
    "overview",
    "quotation",
    "inspection",
    "vehicles",
    "diagnosis",
  ];

  const shareLink = await prisma.shareLink.create({
    data: {
      token,
      role,
      scope: scope || defaultScopes,
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    token: shareLink.token,
    url: `${baseUrl}/share/${shareLink.token}`,
    role: shareLink.role,
    scope: shareLink.scope,
    expiresAt: shareLink.expiresAt?.toISOString(),
    createdAt: shareLink.createdAt.toISOString(),
  };
}

export async function validateShareTokenInDB(token: string) {
  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
  });

  if (!shareLink) {
    return {
      valid: false,
      error: "分享链接不存在",
    };
  }

  if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
    return {
      valid: false,
      error: "分享链接已过期",
    };
  }

  return {
    valid: true,
    role: shareLink.role,
    scope: shareLink.scope,
    expiresAt: shareLink.expiresAt?.toISOString(),
  };
}

export async function getInsuranceDataFromDB() {
  const insuranceDocs = await prisma.insuranceDoc.findMany({
    include: {
      workOrder: {
        include: {
          vehicle: true,
        },
      },
    },
    orderBy: {
      filedAt: "desc",
    },
  });

  const totalClaims = insuranceDocs.length;
  const totalClaimAmount = insuranceDocs.reduce(
    (sum, doc) => sum.add(doc.claimAmount),
    new Decimal(0)
  );
  const pendingCount = insuranceDocs.filter((d) => d.claimStatus === "pending").length;
  const approvedCount = insuranceDocs.filter((d) => d.claimStatus === "approved").length;
  const settledCount = insuranceDocs.filter((d) => d.claimStatus === "settled").length;

  const claims = insuranceDocs.map((doc) => ({
    id: doc.id,
    plateNumber: doc.workOrder?.vehicle?.plateNumber || "",
    vehicleModel: doc.workOrder?.vehicle?.model || "",
    company: doc.company,
    policyNumber: doc.policyNumber,
    claimAmount: Number(doc.claimAmount.toFixed(2)),
    claimStatus: doc.claimStatus,
    filedDate: doc.filedAt ? formatDate(doc.filedAt) : "",
    settledDate: doc.settledAt ? formatDate(doc.settledAt) : undefined,
  }));

  return {
    summary: {
      totalClaims,
      totalClaimAmount: Number(totalClaimAmount.toFixed(2)),
      pendingCount,
      approvedCount,
      settledCount,
      avgClaimAmount: totalClaims > 0 ? Number(totalClaimAmount.div(totalClaims).toFixed(2)) : 0,
    },
    claims,
    lastUpdated: new Date().toISOString(),
  };
}
