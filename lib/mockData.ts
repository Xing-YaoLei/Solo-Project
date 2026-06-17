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

const apartmentIds = ["APT-001", "APT-002", "APT-003", "APT-004", "APT-005"];
const repairTypes = ["水电维修", "家具维修", "家电维修", "门锁维修", "管道疏通"];
const driverNames = ["张伟", "李强", "王磊", "刘洋", "陈明"];
const vehicleNos = ["沪A12345", "沪B67890", "沪C11111", "沪D22222", "沪E33333"];
const materialNames = ["水龙头", "灯泡", "门锁芯", "PVC管道", "开关面板", "马桶配件"];
const operators = ["系统自动", "运营-李娜", "财务-王芳", "运营-赵强"];
const changeReasons = ["用户退款", "优惠调整", "费用补录", "差额修正", "账单核对"];

function generateDates(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
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

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateDispatchTrend(days = 30): DispatchTrendPoint[] {
  const dates = generateDates(days);
  return dates.map((date) => {
    const totalOrders = randInt(25, 80);
    const anomalyOrders = randInt(1, 8);
    const delayedOrders = randInt(2, 15);
    const onTimeOrders = totalOrders - delayedOrders - Math.floor(anomalyOrders / 2);
    const onTimeRate = parseFloat(((onTimeOrders / totalOrders) * 100).toFixed(1));
    return {
      date,
      totalOrders,
      onTimeOrders,
      delayedOrders,
      onTimeRate,
      anomalyOrders,
    };
  });
}

export function generateKPI(): KPIData {
  return {
    todayOrders: randInt(40, 75),
    todayOrdersYoY: randFloat(-15, 25),
    todayOrdersMoM: randFloat(-10, 20),
    onTimeRate: randFloat(78, 96),
    onTimeRateYoY: randFloat(-5, 12),
    onTimeRateMoM: randFloat(-3, 8),
    delayedCount: randInt(3, 18),
    anomalyCount: randInt(1, 7),
  };
}

export function generateAnomalyDistribution(): AnomalyDistribution[] {
  return [
    { name: "路线延误", value: randInt(10, 35), color: "#FF5C7A" },
    { name: "订单取消", value: randInt(5, 20), color: "#FFB020" },
    { name: "改派重派", value: randInt(3, 15), color: "#FFD93D" },
    { name: "物料缺失", value: randInt(2, 12), color: "#00D4FF" },
    { name: "其他异常", value: randInt(1, 8), color: "#00C48C" },
  ];
}

export function generateDataDifferences(count = 20): DataDifference[] {
  const diffs: DataDifference[] = [];
  for (let i = 0; i < count; i++) {
    const orderNo = `WO${Date.now().toString().slice(-6)}${String(i).padStart(3, "0")}`;
    const crmAmount = randFloat(100, 800);
    const meterAmount = crmAmount + randFloat(-80, 80);
    const diffFields: string[] = ["amount"];
    if (Math.random() > 0.5) diffFields.push("repairType");
    if (Math.random() > 0.7) diffFields.push("apartmentId");
    diffs.push({
      id: uuid(),
      orderId: uuid(),
      orderNo,
      crmValue: {
        amount: crmAmount,
        repairType: pick(repairTypes),
        apartmentId: pick(apartmentIds),
      },
      meterValue: {
        amount: meterAmount,
        repairType: pick(repairTypes),
        apartmentId: pick(apartmentIds),
      },
      diffFields,
      diffAmount: parseFloat((meterAmount - crmAmount).toFixed(2)),
      createdAt: new Date(Date.now() - randInt(0, 7) * 86400000).toISOString(),
    });
  }
  return diffs;
}

export function generatePaymentVersions(count = 15): PaymentVersion[] {
  const versions: PaymentVersion[] = [];
  for (let i = 0; i < count; i++) {
    const orderNo = `WO${Date.now().toString().slice(-6)}${String(i).padStart(3, "0")}`;
    const baseAmount = randFloat(150, 600);
    const versionCount = randInt(2, 4);
    const orderId = uuid();
    for (let v = 1; v <= versionCount; v++) {
      versions.push({
        id: uuid(),
        orderId,
        orderNo,
        version: v,
        amount: parseFloat((baseAmount + randFloat(-50, 50) * (v - 1)).toFixed(2)),
        status: v === versionCount ? "已确认" : "已变更",
        operator: pick(operators),
        changedAt: new Date(
          Date.now() - randInt(0, 30) * 86400000 - (versionCount - v) * 3600000
        ).toISOString(),
        changeReason: pick(changeReasons),
      });
    }
  }
  return versions;
}

export function generateRoutePlans(count = 12): RoutePlanType[] {
  const statuses: RoutePlanType["status"][] = ["pending", "in_progress", "completed", "delayed"];
  return Array.from({ length: count }).map((_, i) => {
    const plannedStart = new Date();
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

    const completedOrders = randInt(2, 10);

    return {
      id: uuid(),
      routeName: `路线${String.fromCharCode(65 + i)}-${new Date().getMonth() + 1}${new Date().getDate()}`,
      driverName: driverNames[i % driverNames.length],
      plannedStartTime: plannedStart.toISOString(),
      plannedEndTime: plannedEnd.toISOString(),
      actualStartTime: actualStart.toISOString(),
      actualEndTime: actualEnd.toISOString(),
      plannedOrderCount: completedOrders + randInt(0, 3),
      completedOrderCount: completedOrders,
      status: pick(statuses),
      delayMinutes,
    };
  });
}

export function generateRouteSampleDetails(routeId: string): RouteSampleDetail[] {
  return Array.from({ length: randInt(3, 8) }).map(() => {
    const orderNo = `WO${Date.now().toString().slice(-6)}${String(randInt(100, 999))}`;
    const plannedTime = new Date();
    plannedTime.setHours(randInt(8, 18), randInt(0, 59), 0, 0);
    const isOnTime = Math.random() > 0.3;
    const actualTime = new Date(plannedTime);
    actualTime.setMinutes(actualTime.getMinutes() + (isOnTime ? randInt(-15, 15) : randInt(30, 120)));
    const delayMinutes = isOnTime
      ? undefined
      : Math.max(0, Math.round((actualTime.getTime() - plannedTime.getTime()) / 60000));

    return {
      orderId: uuid(),
      orderNo,
      apartmentId: pick(apartmentIds),
      repairType: pick(repairTypes),
      plannedTime: plannedTime.toISOString(),
      actualTime: actualTime.toISOString(),
      isOnTime,
      delayMinutes,
      status: isOnTime ? "已完成" : "延误完成",
    };
  });
}

export function generateDriverCheckins(count = 10): DriverCheckinType[] {
  const statuses: DriverCheckinType["status"][] = ["checked_in", "not_checked_in", "abnormal"];
  return Array.from({ length: count }).map((_, i) => {
    const checkinTime = new Date();
    checkinTime.setHours(randInt(6, 9), randInt(0, 59), 0, 0);
    const status = pick(statuses);
    return {
      id: uuid(),
      driverId: uuid(),
      driverName: driverNames[i % driverNames.length],
      vehicleNo: vehicleNos[i % vehicleNos.length],
      routeId: uuid(),
      routeName: `路线${String.fromCharCode(65 + i)}`,
      checkinTime: status === "not_checked_in" ? "" : checkinTime.toISOString(),
      checkinLocation: {
        lat: randFloat(31.1, 31.3, 6),
        lng: randFloat(121.3, 121.6, 6),
      },
      status,
    };
  });
}

export function generateTrackPoints(points = 30): TrackPointType[] {
  const baseLat = 31.2;
  const baseLng = 121.45;
  const result: TrackPointType[] = [];
  const startTime = new Date();
  startTime.setHours(8, 0, 0, 0);

  for (let i = 0; i < points; i++) {
    const t = new Date(startTime);
    t.setMinutes(t.getMinutes() + i * 15);
    result.push({
      timestamp: t.toISOString(),
      lat: baseLat + randFloat(-0.05, 0.05, 6),
      lng: baseLng + randFloat(-0.08, 0.08, 6),
      speed: randFloat(0, 60),
      orderId: i % 5 === 0 ? uuid() : undefined,
    });
  }
  return result;
}

export function generateLoadingItems(count = 25): LoadingItemType[] {
  const statuses: LoadingItemType["status"][] = ["normal", "abnormal", "missing"];
  return Array.from({ length: count }).map((_, i) => {
    const quantity = randInt(1, 20);
    const status = pick(statuses);
    return {
      id: uuid(),
      routeId: uuid(),
      routeName: `路线${String.fromCharCode(65 + (i % 5))}`,
      orderId: uuid(),
      orderNo: `WO${Date.now().toString().slice(-6)}${String(randInt(100, 999))}`,
      materialName: pick(materialNames),
      quantity,
      unit: Math.random() > 0.5 ? "个" : "套",
      loadedQuantity: status === "missing" ? randInt(0, quantity - 1) : quantity,
      status,
      originalRecordId: `REC-${Date.now().toString().slice(-6)}-${String(i).padStart(3, "0")}`,
      remark: status !== "normal" ? pick(["仓库库存不足", "物料损坏更换", "用户临时增加"]) : undefined,
    };
  });
}

export function generateOriginalRecord(recordId: string): OriginalRecordType {
  return {
    id: recordId,
    materialName: pick(materialNames),
    quantity: randInt(1, 20),
    unit: pick(["个", "套", "米"]),
    enteredBy: pick(["仓库管理员-张磊", "调度员-李娜", "运营-王强"]),
    enteredAt: new Date(Date.now() - randInt(1, 7) * 86400000).toISOString(),
    source: pick(["WMS系统", "手工录入", "调拨单"]),
    rawData: {
      batchNo: `BATCH-${randInt(10000, 99999)}`,
      warehouse: pick(["中心仓库", "北区仓库", "南区仓库"]),
      shelfNo: `A${randInt(1, 20)}-${randInt(1, 10)}`,
      operatorSignature: pick(["ZL", "LN", "WQ"]),
    },
  };
}
