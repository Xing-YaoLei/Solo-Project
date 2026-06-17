import type {
  DispatchTrendPoint,
  KPIData,
  AnomalyDistribution,
  DataDifference,
  PaymentVersion,
  RoutePlanType,
  RouteSampleDetail,
  DriverCheckinType,
  TrackPointType,
  LoadingItemType,
  OriginalRecordType,
} from "@/types";

const APARTMENT_IDS = ["APT-001", "APT-002", "APT-003", "APT-004", "APT-005"];
const REPAIR_TYPES = ["水电维修", "家具维修", "家电维修", "门锁维修", "管道疏通"];
const DRIVER_NAMES = ["张伟", "李强", "王磊", "刘洋", "陈明"];
const VEHICLE_NOS = ["沪A12345", "沪B67890", "沪C11111", "沪D22222", "沪E33333"];
const MATERIAL_NAMES = ["水龙头", "灯泡", "门锁芯", "PVC管道", "开关面板", "马桶配件"];
const OPERATORS = ["系统自动", "运营-李娜", "财务-王芳", "运营-赵强"];
const CHANGE_REASONS = ["用户退款", "优惠调整", "费用补录", "差额修正", "账单核对"];

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatDateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

type BaseOrder = {
  id: string;
  orderNo: string;
  apartmentId: string;
  repairType: string;
  plannedTime: Date;
  actualTime: Date;
  isOnTime: boolean;
  delayMinutes?: number;
  amount: number;
  anomalyType?: string;
  createdAt: Date;
};

type BaseRoute = {
  id: string;
  routeName: string;
  driverId: string;
  driverName: string;
  vehicleNo: string;
  plannedStart: Date;
  plannedEnd: Date;
  actualStart: Date;
  actualEnd: Date;
  plannedOrderCount: number;
  completedOrderCount: number;
  status: "pending" | "in_progress" | "completed" | "delayed";
  delayMinutes?: number;
  orderIds: string[];
};

type UnifiedData = {
  orders: BaseOrder[];
  routes: BaseRoute[];
  generatedAt: number;
};

const DATA_TTL_MS = 10 * 60 * 1000;
let cachedData: UnifiedData | null = null;

function generateUnifiedData(): UnifiedData {
  const now = Date.now();
  if (cachedData && now - cachedData.generatedAt < DATA_TTL_MS) {
    return cachedData;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const routes: BaseRoute[] = [];
  for (let i = 0; i < 12; i++) {
    const driverIdx = i % DRIVER_NAMES.length;
    const plannedStart = new Date(today);
    plannedStart.setHours(randInt(7, 10), randInt(0, 59), 0, 0);
    const plannedEnd = new Date(plannedStart);
    plannedEnd.setHours(plannedStart.getHours() + randInt(4, 8));

    const isDelayed = Math.random() > 0.6;
    const actualStart = new Date(plannedStart);
    actualStart.setMinutes(actualStart.getMinutes() + randInt(-10, 30));
    const actualEnd = new Date(plannedEnd);
    actualEnd.setMinutes(
      actualEnd.getMinutes() + (isDelayed ? randInt(30, 180) : randInt(-20, 30))
    );

    const delayMinutes = isDelayed
      ? Math.max(0, Math.round((actualEnd.getTime() - plannedEnd.getTime()) / 60000))
      : undefined;

    const statusOptions: BaseRoute["status"][] = [
      "in_progress",
      "completed",
      "completed",
      isDelayed ? "delayed" : "completed",
    ];

    const plannedOrderCount = randInt(4, 10);

    routes.push({
      id: uuid(),
      routeName: `路线${String.fromCharCode(65 + i)}-${today.getMonth() + 1}${today.getDate()}`,
      driverId: uuid(),
      driverName: DRIVER_NAMES[driverIdx],
      vehicleNo: VEHICLE_NOS[driverIdx],
      plannedStart,
      plannedEnd,
      actualStart,
      actualEnd,
      plannedOrderCount,
      completedOrderCount: Math.max(0, plannedOrderCount - randInt(0, 2)),
      status: pick(statusOptions),
      delayMinutes,
      orderIds: [],
    });
  }

  const orders: BaseOrder[] = [];
  const daysRange = 30;
  let orderCounter = 1;

  for (let dayOffset = daysRange - 1; dayOffset >= 0; dayOffset--) {
    const day = new Date(today);
    day.setDate(day.getDate() - dayOffset);
    const ordersPerDay = randInt(25, 60);

    for (let o = 0; o < ordersPerDay; o++) {
      const assignedRoute = routes[orderCounter % routes.length];
      const plannedTime = new Date(day);
      plannedTime.setHours(randInt(8, 18), randInt(0, 59), 0, 0);

      const isOnTime = Math.random() > 0.25;
      const actualTime = new Date(plannedTime);
      actualTime.setMinutes(
        actualTime.getMinutes() + (isOnTime ? randInt(-15, 15) : randInt(30, 180))
      );

      const delayMinutes = isOnTime
        ? undefined
        : Math.max(0, Math.round((actualTime.getTime() - plannedTime.getTime()) / 60000));

      let anomalyType: string | undefined;
      if (!isOnTime) anomalyType = "路线延误";
      else if (Math.random() > 0.92) anomalyType = pick(["订单取消", "改派重派", "物料缺失", "其他异常"]);

      const order: BaseOrder = {
        id: uuid(),
        orderNo: `WO${formatDateKey(day).replace(/-/g, "").slice(2)}${String(orderCounter).padStart(4, "0")}`,
        apartmentId: pick(APARTMENT_IDS),
        repairType: pick(REPAIR_TYPES),
        plannedTime,
        actualTime,
        isOnTime,
        delayMinutes,
        amount: randFloat(80, 800),
        anomalyType,
        createdAt: new Date(plannedTime.getTime() - randInt(1, 24) * 3600000),
      };

      assignedRoute.orderIds.push(order.id);
      orders.push(order);
      orderCounter++;
    }
  }

  cachedData = { orders, routes, generatedAt: now };
  return cachedData;
}

export function getData() {
  return generateUnifiedData();
}

export function refreshData() {
  cachedData = null;
  return generateUnifiedData();
}

export function getKPIData(): KPIData {
  const { orders } = getData();
  const today = formatDateKey(new Date());
  const todayOrders = orders.filter((o) => formatDateKey(o.plannedTime) === today);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = formatDateKey(yesterday);
  const yesterdayOrders = orders.filter((o) => formatDateKey(o.plannedTime) === yKey);

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lmKey = formatDateKey(lastMonth);
  const lmOrders = orders.filter((o) => formatDateKey(o.plannedTime) === lmKey);

  const todayOnTimeRate = todayOrders.length
    ? (todayOrders.filter((o) => o.isOnTime).length / todayOrders.length) * 100
    : 0;
  const yesterdayOnTimeRate = yesterdayOrders.length
    ? (yesterdayOrders.filter((o) => o.isOnTime).length / yesterdayOrders.length) * 100
    : 0;
  const lmOnTimeRate = lmOrders.length
    ? (lmOrders.filter((o) => o.isOnTime).length / lmOrders.length) * 100
    : 0;

  const safeRate = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);

  return {
    todayOrders: todayOrders.length,
    todayOrdersYoY: parseFloat(safeRate(todayOrders.length, lmOrders.length).toFixed(1)),
    todayOrdersMoM: parseFloat(safeRate(todayOrders.length, yesterdayOrders.length).toFixed(1)),
    onTimeRate: parseFloat(todayOnTimeRate.toFixed(1)),
    onTimeRateYoY: parseFloat((todayOnTimeRate - lmOnTimeRate).toFixed(1)),
    onTimeRateMoM: parseFloat((todayOnTimeRate - yesterdayOnTimeRate).toFixed(1)),
    delayedCount: todayOrders.filter((o) => !o.isOnTime).length,
    anomalyCount: todayOrders.filter((o) => o.anomalyType).length,
  };
}

export function getTrendData(days = 30): {
  trend: DispatchTrendPoint[];
  anomalies: AnomalyDistribution[];
} {
  const { orders } = getData();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const trend: DispatchTrendPoint[] = [];
  const anomalyMap = new Map<string, number>();

  for (let d = days - 1; d >= 0; d--) {
    const day = new Date(today);
    day.setDate(day.getDate() - d);
    const dk = formatDateKey(day);
    const dayOrders = orders.filter((o) => formatDateKey(o.plannedTime) === dk);

    const total = dayOrders.length;
    const onTime = dayOrders.filter((o) => o.isOnTime).length;
    const delayed = total - onTime;
    const anomalyOrders = dayOrders.filter((o) => o.anomalyType);

    trend.push({
      date: dk,
      totalOrders: total,
      onTimeOrders: onTime,
      delayedOrders: delayed,
      onTimeRate: total ? parseFloat(((onTime / total) * 100).toFixed(1)) : 0,
      anomalyOrders: anomalyOrders.length,
    });

    anomalyOrders.forEach((o) => {
      const t = o.anomalyType ?? "其他异常";
      anomalyMap.set(t, (anomalyMap.get(t) ?? 0) + 1);
    });
  }

  const anomalyColors = ["#FF5C7A", "#FFB020", "#FFD93D", "#00D4FF", "#00C48C"];
  const anomalies: AnomalyDistribution[] = Array.from(anomalyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name,
      value,
      color: anomalyColors[i % anomalyColors.length],
    }));

  if (anomalies.length === 0) {
    anomalies.push(
      { name: "路线延误", value: 15, color: "#FF5C7A" },
      { name: "订单取消", value: 8, color: "#FFB020" },
      { name: "改派重派", value: 6, color: "#FFD93D" },
      { name: "物料缺失", value: 4, color: "#00D4FF" },
      { name: "其他异常", value: 2, color: "#00C48C" }
    );
  }

  return { trend, anomalies };
}

export function getDataDifferences(limit = 20): {
  list: DataDifference[];
  stats: { totalCount: number; affectedOrders: number; totalDiffAmount: number };
} {
  const { orders } = getData();
  const diffs: DataDifference[] = [];
  const total = Math.min(limit, Math.floor(orders.length * 0.15));

  for (let i = 0; i < total; i++) {
    const order = orders[i * Math.floor(orders.length / total)];
    const crmAmount = parseFloat(order.amount.toFixed(2));
    const meterAmount = parseFloat((order.amount + randFloat(-120, 120)).toFixed(2));
    const diffFields: string[] = ["amount"];
    if (Math.random() > 0.6) diffFields.push("repairType");
    if (Math.random() > 0.8) diffFields.push("apartmentId");

    diffs.push({
      id: uuid(),
      orderId: order.id,
      orderNo: order.orderNo,
      crmValue: {
        amount: crmAmount,
        repairType: order.repairType,
        apartmentId: order.apartmentId,
      },
      meterValue: {
        amount: meterAmount,
        repairType: diffFields.includes("repairType") ? pick(REPAIR_TYPES) : order.repairType,
        apartmentId: diffFields.includes("apartmentId") ? pick(APARTMENT_IDS) : order.apartmentId,
      },
      diffFields,
      diffAmount: parseFloat((meterAmount - crmAmount).toFixed(2)),
      createdAt: order.createdAt.toISOString(),
    });
  }

  const totalDiffAmount = diffs.reduce((s, d) => s + Math.abs(d.diffAmount ?? 0), 0);

  return {
    list: diffs,
    stats: {
      totalCount: diffs.length,
      affectedOrders: new Set(diffs.map((d) => d.orderId)).size,
      totalDiffAmount: parseFloat(totalDiffAmount.toFixed(2)),
    },
  };
}

export function getPaymentVersions(limit = 15): {
  list: PaymentVersion[];
  stats: { totalChanges: number; affectedOrders: number };
} {
  const { orders } = getData();
  const versions: PaymentVersion[] = [];
  const count = Math.min(limit, Math.floor(orders.length * 0.1));

  for (let i = 0; i < count; i++) {
    const order = orders[i * Math.floor(orders.length / count)];
    const baseAmount = order.amount;
    const vCount = randInt(2, 4);

    for (let v = 1; v <= vCount; v++) {
      versions.push({
        id: uuid(),
        orderId: order.id,
        orderNo: order.orderNo,
        version: v,
        amount: parseFloat((baseAmount + randFloat(-60, 60) * (v - 1)).toFixed(2)),
        status: v === vCount ? "已确认" : "已变更",
        operator: pick(OPERATORS),
        changedAt: new Date(
          order.plannedTime.getTime() + (v - 1) * 3600000 + randInt(0, 10000)
        ).toISOString(),
        changeReason: pick(CHANGE_REASONS),
      });
    }
  }

  return {
    list: versions.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()),
    stats: {
      totalChanges: versions.length,
      affectedOrders: new Set(versions.map((v) => v.orderId)).size,
    },
  };
}

export function getRoutePlans(): {
  list: RoutePlanType[];
  stats: {
    totalRoutes: number;
    completedRoutes: number;
    delayedRoutes: number;
    avgDelayMinutes: number;
  };
} {
  const { routes } = getData();

  const list: RoutePlanType[] = routes.map((r) => ({
    id: r.id,
    routeName: r.routeName,
    driverName: r.driverName,
    plannedStartTime: r.plannedStart.toISOString(),
    plannedEndTime: r.plannedEnd.toISOString(),
    actualStartTime: r.actualStart.toISOString(),
    actualEndTime: r.actualEnd.toISOString(),
    plannedOrderCount: r.plannedOrderCount,
    completedOrderCount: r.completedOrderCount,
    status: r.status,
    delayMinutes: r.delayMinutes,
  }));

  const delayedRoutes = routes.filter((r) => r.status === "delayed");

  return {
    list,
    stats: {
      totalRoutes: routes.length,
      completedRoutes: routes.filter((r) => r.status === "completed").length,
      delayedRoutes: delayedRoutes.length,
      avgDelayMinutes: delayedRoutes.length
        ? Math.round(delayedRoutes.reduce((s, r) => s + (r.delayMinutes ?? 0), 0) / delayedRoutes.length)
        : 0,
    },
  };
}

export function getRouteDetails(routeId: string): {
  routeId: string;
  samples: RouteSampleDetail[];
  stats: {
    totalSamples: number;
    onTimeCount: number;
    delayedCount: number;
    avgDelayMinutes: number;
  };
  meta: {
    routeName: string;
    driverName: string;
    driverId: string;
    vehicleNo: string;
  };
} {
  const { routes, orders } = getData();
  const route = routes.find((r) => r.id === routeId);

  const samples: RouteSampleDetail[] = [];
  let routeName = "未知路线";
  let driverName = "未知";
  let driverId = "";
  let vehicleNo = "";

  if (route) {
    routeName = route.routeName;
    driverName = route.driverName;
    driverId = route.driverId;
    vehicleNo = route.vehicleNo;

    route.orderIds.forEach((oid) => {
      const o = orders.find((x) => x.id === oid);
      if (o) {
        samples.push({
          orderId: o.id,
          orderNo: o.orderNo,
          apartmentId: o.apartmentId,
          repairType: o.repairType,
          plannedTime: o.plannedTime.toISOString(),
          actualTime: o.actualTime.toISOString(),
          isOnTime: o.isOnTime,
          delayMinutes: o.delayMinutes,
          status: o.isOnTime ? "已完成" : "延误完成",
        });
      }
    });
  }

  if (samples.length === 0 && routes.length > 0) {
    const fallback = routes[0];
    routeName = fallback.routeName;
    driverName = fallback.driverName;
    driverId = fallback.driverId;
    vehicleNo = fallback.vehicleNo;
    orders.slice(0, 5).forEach((o) => {
      samples.push({
        orderId: o.id,
        orderNo: o.orderNo,
        apartmentId: o.apartmentId,
        repairType: o.repairType,
        plannedTime: o.plannedTime.toISOString(),
        actualTime: o.actualTime.toISOString(),
        isOnTime: o.isOnTime,
        delayMinutes: o.delayMinutes,
        status: o.isOnTime ? "已完成" : "延误完成",
      });
    });
  }

  const delayedSamples = samples.filter((s) => !s.isOnTime);

  return {
    routeId,
    samples,
    meta: { routeName, driverName, driverId, vehicleNo },
    stats: {
      totalSamples: samples.length,
      onTimeCount: samples.filter((s) => s.isOnTime).length,
      delayedCount: delayedSamples.length,
      avgDelayMinutes: delayedSamples.length
        ? Math.round(delayedSamples.reduce((s, x) => s + (x.delayMinutes ?? 0), 0) / delayedSamples.length)
        : 0,
    },
  };
}

export function getDriverCheckins(): {
  list: DriverCheckinType[];
  stats: {
    totalDrivers: number;
    checkedIn: number;
    notCheckedIn: number;
    abnormal: number;
  };
} {
  const { routes } = getData();
  const statusPool: DriverCheckinType["status"][] = [
    "checked_in",
    "checked_in",
    "checked_in",
    "checked_in",
    "not_checked_in",
    "abnormal",
  ];

  const list: DriverCheckinType[] = routes.map((r) => {
    const status = pick(statusPool);
    const checkinTime = new Date(r.plannedStart);
    checkinTime.setMinutes(checkinTime.getMinutes() - randInt(15, 60));

    return {
      id: uuid(),
      driverId: r.driverId,
      driverName: r.driverName,
      vehicleNo: r.vehicleNo,
      routeId: r.id,
      routeName: r.routeName,
      checkinTime: status === "not_checked_in" ? "" : checkinTime.toISOString(),
      checkinLocation: {
        lat: randFloat(31.1, 31.3, 6),
        lng: randFloat(121.3, 121.6, 6),
      },
      status,
    };
  });

  return {
    list,
    stats: {
      totalDrivers: list.length,
      checkedIn: list.filter((c) => c.status === "checked_in").length,
      notCheckedIn: list.filter((c) => c.status === "not_checked_in").length,
      abnormal: list.filter((c) => c.status === "abnormal").length,
    },
  };
}

export function getDriverTrack(driverId: string, routeId?: string): {
  driverId: string;
  trackPoints: TrackPointType[];
  stats: {
    totalPoints: number;
    avgSpeed: number;
    orderStops: number;
  };
  meta: {
    driverName: string;
    routeName: string;
    orderIds: string[];
  };
} {
  const { routes, orders } = getData();

  let targetRoute = routes.find((r) => r.id === routeId);
  if (!targetRoute) {
    targetRoute = routes.find((r) => r.driverId === driverId) ?? routes[0];
  }

  const route = targetRoute;
  const baseLat = 31.2;
  const baseLng = 121.45;
  const pointCount = 30;

  const trackPoints: TrackPointType[] = [];
  const routeOrders = orders.filter((o) => route.orderIds.includes(o.id));

  for (let i = 0; i < pointCount; i++) {
    const t = new Date(route.plannedStart);
    t.setMinutes(t.getMinutes() + i * 10);

    const relatedOrder = i % 6 === 0 ? routeOrders[Math.floor(i / 6) % routeOrders.length] : undefined;

    trackPoints.push({
      timestamp: t.toISOString(),
      lat: baseLat + randFloat(-0.05, 0.05, 6),
      lng: baseLng + randFloat(-0.08, 0.08, 6),
      speed: randFloat(0, 60),
      orderId: relatedOrder?.id,
    });
  }

  return {
    driverId,
    trackPoints,
    meta: {
      driverName: route.driverName,
      routeName: route.routeName,
      orderIds: route.orderIds,
    },
    stats: {
      totalPoints: trackPoints.length,
      avgSpeed: trackPoints.length
        ? parseFloat((trackPoints.reduce((s, p) => s + p.speed, 0) / trackPoints.length).toFixed(1))
        : 0,
      orderStops: trackPoints.filter((p) => p.orderId).length,
    },
  };
}

export function getLoadingList(
  filterRouteId?: string,
  filterOrderId?: string
): {
  list: LoadingItemType[];
  stats: {
    totalItems: number;
    normalItems: number;
    abnormalItems: number;
    missingItems: number;
  };
} {
  const { routes, orders } = getData();
  const items: LoadingItemType[] = [];

  const targetRoutes = filterRouteId
    ? routes.filter((r) => r.id === filterRouteId)
    : routes;
  const targetOrderIds = filterOrderId ? [filterOrderId] : null;

  let itemIndex = 0;

  targetRoutes.forEach((route) => {
    const routeOrderIds = targetOrderIds
      ? route.orderIds.filter((id) => id === targetOrderIds[0])
      : route.orderIds;

    routeOrderIds.forEach((oid) => {
      const order = orders.find((x) => x.id === oid);
      if (!order) return;

      const itemCount = randInt(1, 3);
      for (let m = 0; m < itemCount; m++) {
        const quantity = randInt(1, 10);
        const isAbnormal = order.anomalyType || Math.random() > 0.78;
        const status: LoadingItemType["status"] = !isAbnormal
          ? "normal"
          : Math.random() > 0.5
          ? "abnormal"
          : "missing";
        const loadedQuantity = status === "normal"
          ? quantity
          : Math.max(0, quantity - randInt(1, quantity));

        items.push({
          id: uuid(),
          routeId: route.id,
          routeName: route.routeName,
          orderId: order.id,
          orderNo: order.orderNo,
          materialName: pick(MATERIAL_NAMES),
          quantity,
          unit: pick(["个", "套", "米"]),
          loadedQuantity,
          status,
          originalRecordId: `REC-${new Date(order.plannedTime)
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, "")}-${String(itemIndex).padStart(5, "0")}`,
          remark: status !== "normal"
            ? pick(["仓库库存不足", "物料损坏更换", "用户临时增加", "规格型号不符"])
            : undefined,
        });
        itemIndex++;
      }
    });
  });

  return {
    list: items.sort((a, b) => a.routeName.localeCompare(b.routeName)),
    stats: {
      totalItems: items.length,
      normalItems: items.filter((i) => i.status === "normal").length,
      abnormalItems: items.filter((i) => i.status === "abnormal").length,
      missingItems: items.filter((i) => i.status === "missing").length,
    },
  };
}

export function getOriginalRecord(recordId: string): OriginalRecordType {
  return {
    id: recordId,
    materialName: pick(MATERIAL_NAMES),
    quantity: randInt(1, 15),
    unit: pick(["个", "套", "米"]),
    enteredBy: pick(["仓库管理员-张磊", "调度员-李娜", "运营-王强", "采购-刘敏"]),
    enteredAt: new Date(
      Date.now() - randInt(1, 7) * 86400000 - randInt(0, 43200) * 1000
    ).toISOString(),
    source: pick(["WMS系统", "手工录入", "调拨单"]),
    rawData: {
      batchNo: `BATCH-${randInt(10000, 99999)}`,
      warehouse: pick(["中心仓库", "北区仓库", "南区仓库"]),
      shelfNo: `A${randInt(1, 20)}-${randInt(1, 10)}`,
      operatorSignature: pick(["ZL", "LN", "WQ", "LM"]),
    },
  };
}
