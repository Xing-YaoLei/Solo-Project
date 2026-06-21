import { eachDayOfInterval, format, subDays, subMonths, startOfDay } from "date-fns";

const regions = [
  { id: "region-1", name: "朝阳区", code: "BJ-CY", city: "北京", province: "北京市" },
  { id: "region-2", name: "海淀区", code: "BJ-HD", city: "北京", province: "北京市" },
  { id: "region-3", name: "东城区", code: "BJ-DC", city: "北京", province: "北京市" },
  { id: "region-4", name: "西城区", code: "BJ-XC", city: "北京", province: "北京市" },
  { id: "region-5", name: "丰台区", code: "BJ-FT", city: "北京", province: "北京市" },
];

const subsidyRules = [
  {
    id: "rule-1",
    ruleName: "基础补贴规则",
    ruleCode: "BASE_001",
    description: "基础配送补贴，按距离计算",
    subsidyType: "DISTANCE",
    baseAmount: 5.0,
    distanceMultiplier: 1.5,
    timeMultiplier: null,
    minAmount: 3.0,
    maxAmount: 20.0,
    effectiveFrom: new Date("2024-01-01"),
    effectiveTo: null,
    isActive: true,
  },
  {
    id: "rule-2",
    ruleName: "高峰时段补贴",
    ruleCode: "PEAK_001",
    description: "午晚高峰时段额外补贴",
    subsidyType: "TIME",
    baseAmount: 3.0,
    distanceMultiplier: null,
    timeMultiplier: 2.0,
    minAmount: 2.0,
    maxAmount: 10.0,
    effectiveFrom: new Date("2024-01-01"),
    effectiveTo: null,
    isActive: true,
  },
  {
    id: "rule-3",
    ruleName: "恶劣天气补贴",
    ruleCode: "WEATHER_001",
    description: "恶劣天气额外补贴",
    subsidyType: "WEATHER",
    baseAmount: 5.0,
    distanceMultiplier: 0.5,
    timeMultiplier: null,
    minAmount: 3.0,
    maxAmount: 15.0,
    effectiveFrom: new Date("2024-01-01"),
    effectiveTo: null,
    isActive: true,
  },
];

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
  return Math.floor(randomInRange(min, max + 1));
}

export function generateSubsidyTrendData(days: number = 30) {
  const endDate = new Date();
  const startDate = subDays(endDate, days - 1);
  const daysArray = eachDayOfInterval({ start: startDate, end: endDate });

  return daysArray.map((day) => {
    const orderCount = randomInt(80, 200);
    const baseAmount = orderCount * randomInRange(4, 6);
    const distanceBonus = orderCount * randomInRange(2, 4);
    const timeBonus = orderCount * randomInRange(1, 3);
    const otherBonus = orderCount * randomInRange(0.5, 1.5);
    const totalAmount = baseAmount + distanceBonus + timeBonus + otherBonus;

    return {
      date: format(day, "yyyy-MM-dd"),
      totalAmount: Math.round(totalAmount * 100) / 100,
      orderCount,
      avgAmount: Math.round((totalAmount / orderCount) * 100) / 100,
      baseAmount: Math.round(baseAmount * 100) / 100,
      distanceBonus: Math.round(distanceBonus * 100) / 100,
      timeBonus: Math.round(timeBonus * 100) / 100,
      otherBonus: Math.round(otherBonus * 100) / 100,
    };
  });
}

export function generateRegionData(days: number = 30) {
  return regions.map((region) => {
    const orderCount = randomInt(200, 800);
    const totalSubsidy = orderCount * randomInRange(6, 10);

    return {
      regionId: region.id,
      regionName: region.name,
      city: region.city,
      totalSubsidy: Math.round(totalSubsidy * 100) / 100,
      orderCount,
      avgSubsidy: Math.round((totalSubsidy / orderCount) * 100) / 100,
      avgDispatchDuration: Math.round(randomInRange(5, 20) * 10) / 10,
    };
  }).sort((a, b) => b.totalSubsidy - a.totalSubsidy);
}

export function generateDurationData() {
  const buckets = [
    { label: "0-5分钟", min: 0, max: 5 },
    { label: "5-10分钟", min: 5, max: 10 },
    { label: "10-15分钟", min: 10, max: 15 },
    { label: "15-30分钟", min: 15, max: 30 },
    { label: "30分钟以上", min: 30, max: 60 },
  ];

  return buckets.map((bucket) => {
    const orderCount = randomInt(50, 300);
    const totalAmount = orderCount * randomInRange(5, 12);

    return {
      label: bucket.label,
      totalAmount: Math.round(totalAmount * 100) / 100,
      orderCount,
      avgAmount: Math.round((totalAmount / orderCount) * 100) / 100,
    };
  });
}

export function generateDamageRecords(count: number = 20) {
  const severities = ["MINOR", "MODERATE", "SEVERE", "TOTAL_LOSS"];
  const severityLabels: Record<string, string> = {
    MINOR: "轻微",
    MODERATE: "中度",
    SEVERE: "严重",
    TOTAL_LOSS: "全损",
  };
  const itemTypes = ["餐饮", "生鲜", "文件", "电子产品", "日用品", "服装"];

  return Array.from({ length: count }, (_, i) => {
    const severity = severities[randomInt(0, 3)];
    const region = regions[randomInt(0, 4)];
    const estimatedLoss = severity === "TOTAL_LOSS" 
      ? randomInRange(200, 1000)
      : severity === "SEVERE"
        ? randomInRange(100, 500)
        : severity === "MODERATE"
          ? randomInRange(50, 200)
          : randomInRange(20, 100);

    return {
      id: `damage-${i + 1}`,
      orderId: `order-${randomInt(1000, 9999)}`,
      orderNo: `DD${randomInt(100000, 999999)}`,
      severity,
      severityLabel: severityLabels[severity],
      description: `物品在运输过程中受损，${severityLabels[severity]}程度`,
      damageItems: itemTypes[randomInt(0, 5)],
      estimatedLoss: Math.round(estimatedLoss * 100) / 100,
      photoUrls: [
        "https://picsum.photos/200/200?random=1",
        "https://picsum.photos/200/200?random=2",
      ],
      regionId: region.id,
      regionName: region.name,
      reportedAt: format(subDays(new Date(), randomInt(0, 30)), "yyyy-MM-dd HH:mm:ss"),
      reportedBy: `骑手${randomInt(100, 999)}`,
      compensation: randomInt(0, 1) === 1 ? {
        id: `comp-${i + 1}`,
        amount: Math.round(estimatedLoss * randomInRange(0.5, 1) * 100) / 100,
        compensationType: "物品赔付",
        paidAt: format(subDays(new Date(), randomInt(0, 10)), "yyyy-MM-dd HH:mm:ss"),
        caliberNote: "按照物品价值的70%进行赔付，最高不超过500元",
      } : null,
    };
  });
}

export function generateSettlementDetails(count: number = 30) {
  const statuses = ["PENDING", "SETTLED", "ADJUSTED"];
  const statusLabels: Record<string, string> = {
    PENDING: "待结算",
    SETTLED: "已结算",
    ADJUSTED: "已调整",
  };

  return Array.from({ length: count }, (_, i) => {
    const status = statuses[randomInt(0, 2)];
    const region = regions[randomInt(0, 4)];
    const baseFee = randomInRange(8, 20);
    const subsidyAmount = randomInRange(3, 15);
    const deductionAmount = randomInt(0, 1) === 1 ? randomInRange(0, 5) : 0;
    const totalAmount = baseFee + subsidyAmount - deductionAmount;

    return {
      id: `settlement-${i + 1}`,
      settlementNo: `JS${randomInt(100000, 999999)}`,
      orderId: `order-${randomInt(1000, 9999)}`,
      orderNo: `DD${randomInt(100000, 999999)}`,
      status,
      statusLabel: statusLabels[status],
      baseFee: Math.round(baseFee * 100) / 100,
      subsidyAmount: Math.round(subsidyAmount * 100) / 100,
      deductionAmount: Math.round(deductionAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      regionId: region.id,
      regionName: region.name,
      riderName: `骑手${randomInt(100, 999)}`,
      settlementDate: format(subDays(new Date(), randomInt(0, 30)), "yyyy-MM-dd"),
      settledAt: status !== "PENDING" 
        ? format(subDays(new Date(), randomInt(0, 30)), "yyyy-MM-dd HH:mm:ss")
        : null,
      remark: deductionAmount > 0 ? "超时扣除部分补贴" : null,
    };
  }).sort((a, b) => new Date(b.settlementDate).getTime() - new Date(a.settlementDate).getTime());
}

export function generateAppealList(count: number = 15) {
  const statuses = ["PENDING", "APPROVED", "REJECTED"];
  const statusLabels: Record<string, string> = {
    PENDING: "待审核",
    APPROVED: "已通过",
    REJECTED: "已驳回",
  };

  return Array.from({ length: count }, (_, i) => {
    const status = statuses[randomInt(0, 2)];
    const region = regions[randomInt(0, 4)];

    return {
      id: `appeal-${i + 1}`,
      subsidyId: `subsidy-${randomInt(100, 999)}`,
      orderId: `order-${randomInt(1000, 9999)}`,
      orderNo: `DD${randomInt(100000, 999999)}`,
      status,
      statusLabel: statusLabels[status],
      reason: [
        "距离计算有误",
        "实际配送时间更长",
        "恶劣天气未计算补贴",
        "系统派单延迟",
        "物品损坏应由平台承担",
      ][randomInt(0, 4)],
      evidenceUrls: [
        "https://picsum.photos/300/200?random=1",
        "https://picsum.photos/300/200?random=2",
      ],
      submittedAt: format(subDays(new Date(), randomInt(0, 30)), "yyyy-MM-dd HH:mm:ss"),
      reviewedAt: status !== "PENDING"
        ? format(subDays(new Date(), randomInt(0, 25)), "yyyy-MM-dd HH:mm:ss")
        : null,
      reviewedBy: status !== "PENDING" ? `审核员${randomInt(1, 10)}` : null,
      reviewNote: status === "APPROVED" 
        ? "申诉成立，已补发补贴"
        : status === "REJECTED"
          ? "证据不足，申诉驳回"
          : null,
      subsidyAmount: Math.round(randomInRange(5, 30) * 100) / 100,
      regionName: region.name,
    };
  }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export function generateCompensationRecords(count: number = 20) {
  return Array.from({ length: count }, (_, i) => {
    const region = regions[randomInt(0, 4)];
    const amount = randomInRange(50, 500);

    return {
      id: `compensation-${i + 1}`,
      damageId: `damage-${randomInt(1, 50)}`,
      orderId: `order-${randomInt(1000, 9999)}`,
      orderNo: `DD${randomInt(100000, 999999)}`,
      amount: Math.round(amount * 100) / 100,
      compensationType: ["物品赔付", "服务补偿", "运费减免"][randomInt(0, 2)],
      description: "配送过程中物品受损，按照赔付标准进行赔付",
      paidAt: format(subDays(new Date(), randomInt(0, 30)), "yyyy-MM-dd HH:mm:ss"),
      caliberNote: [
        "按照物品价值的70%进行赔付，最高不超过500元",
        "服务质量问题，给予全额退款补偿",
        "运费减免，下次订单可用",
      ][randomInt(0, 2)],
      regionName: region.name,
      damageItems: ["餐饮", "生鲜", "电子产品", "日用品"][randomInt(0, 3)],
      severity: ["轻微", "中度", "严重"][randomInt(0, 2)],
    };
  }).sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
}

export function generateSyncBatches(count: number = 15) {
  const sources = ["PAYMENT_SYSTEM", "ORDER_SYSTEM", "MAP_API"];
  const sourceLabels: Record<string, string> = {
    PAYMENT_SYSTEM: "支付系统",
    ORDER_SYSTEM: "订单系统",
    MAP_API: "地图接口",
  };
  const statuses = ["SUCCESS", "FAILED", "PARTIAL", "RUNNING"];
  const statusLabels: Record<string, string> = {
    SUCCESS: "成功",
    FAILED: "失败",
    PARTIAL: "部分成功",
    RUNNING: "进行中",
  };

  return Array.from({ length: count }, (_, i) => {
    const source = sources[randomInt(0, 2)];
    const status = statuses[randomInt(0, 3)];
    const totalCount = randomInt(50, 500);
    const successCount = status === "SUCCESS" 
      ? totalCount
      : status === "FAILED"
        ? 0
        : randomInt(10, totalCount - 10);
    const failedCount = totalCount - successCount;

    return {
      id: `batch-${i + 1}`,
      batchNumber: `${source}-${Date.now() - i * 3600000}`,
      source,
      sourceLabel: sourceLabels[source],
      status,
      statusLabel: statusLabels[status],
      totalCount,
      successCount,
      failedCount,
      errorMessage: status !== "SUCCESS" ? "部分数据同步失败，请检查网络连接" : null,
      startedAt: format(subDays(new Date(), randomInt(0, 7)), "yyyy-MM-dd HH:mm:ss"),
      completedAt: status !== "RUNNING"
        ? format(subDays(new Date(), randomInt(0, 7)), "yyyy-MM-dd HH:mm:ss")
        : null,
      createdAt: format(subDays(new Date(), randomInt(0, 7)), "yyyy-MM-dd HH:mm:ss"),
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getSubsidyRules() {
  return subsidyRules;
}

export function getRegions() {
  return regions;
}

export function generateYoYComparison() {
  const currentData = generateSubsidyTrendData(30);
  const lastYearData = generateSubsidyTrendData(30).map(d => ({
    ...d,
    totalAmount: Math.round(d.totalAmount * 0.8 * 100) / 100,
    orderCount: Math.round(d.orderCount * 0.85),
    avgAmount: Math.round((d.totalAmount * 0.8 / (d.orderCount * 0.85)) * 100) / 100,
  }));

  const currentTotal = currentData.reduce((sum, d) => sum + d.totalAmount, 0);
  const lastYearTotal = lastYearData.reduce((sum, d) => sum + d.totalAmount, 0);

  return {
    current: {
      totalAmount: Math.round(currentTotal * 100) / 100,
      orderCount: currentData.reduce((sum, d) => sum + d.orderCount, 0),
      avgAmount: Math.round((currentTotal / currentData.length) * 100) / 100,
    },
    lastYear: {
      totalAmount: Math.round(lastYearTotal * 100) / 100,
      orderCount: lastYearData.reduce((sum, d) => sum + d.orderCount, 0),
      avgAmount: Math.round((lastYearTotal / lastYearData.length) * 100) / 100,
    },
    yoyRate: Math.round(((currentTotal - lastYearTotal) / lastYearTotal) * 1000) / 10,
    dailyData: currentData,
  };
}

export function generateMoMComparison() {
  const currentData = generateSubsidyTrendData(30);
  const lastMonthData = generateSubsidyTrendData(30).map(d => ({
    ...d,
    totalAmount: Math.round(d.totalAmount * 0.95 * 100) / 100,
    orderCount: Math.round(d.orderCount * 0.97),
  }));

  const currentTotal = currentData.reduce((sum, d) => sum + d.totalAmount, 0);
  const lastMonthTotal = lastMonthData.reduce((sum, d) => sum + d.totalAmount, 0);

  return {
    current: {
      totalAmount: Math.round(currentTotal * 100) / 100,
      orderCount: currentData.reduce((sum, d) => sum + d.orderCount, 0),
      avgAmount: Math.round((currentTotal / currentData.length) * 100) / 100,
    },
    lastMonth: {
      totalAmount: Math.round(lastMonthTotal * 100) / 100,
      orderCount: lastMonthData.reduce((sum, d) => sum + d.orderCount, 0),
      avgAmount: Math.round((lastMonthTotal / lastMonthData.length) * 100) / 100,
    },
    momRate: Math.round(((currentTotal - lastMonthTotal) / lastMonthTotal) * 1000) / 10,
  };
}

export function generateOrderReport(days: number = 30) {
  const trendData = generateSubsidyTrendData(days);
  const totalOrders = trendData.reduce((sum, d) => sum + d.orderCount, 0);
  const totalSubsidy = trendData.reduce((sum, d) => sum + d.totalAmount, 0);

  return {
    dailyStats: trendData.map(d => ({
      ...d,
      deliveredCount: Math.round(d.orderCount * 0.92),
      damagedCount: Math.round(d.orderCount * 0.02),
      avgDispatchDuration: Math.round(randomInRange(8, 15) * 10) / 10,
      avgDeliveryDuration: Math.round(randomInRange(25, 45) * 10) / 10,
      damageRate: Math.round(randomInRange(1, 3) * 10) / 10,
    })),
    summary: {
      totalOrders,
      totalDelivered: Math.round(totalOrders * 0.92),
      totalDamaged: Math.round(totalOrders * 0.02),
      totalSubsidy: Math.round(totalSubsidy * 100) / 100,
      avgOrderValue: Math.round(randomInRange(30, 80) * 100) / 100,
      avgDispatchDuration: Math.round(randomInRange(8, 15) * 10) / 10,
      damageRate: Math.round(randomInRange(1, 3) * 10) / 10,
    },
  };
}

export function generateOrderDetail(orderId: string) {
  const region = regions[randomInt(0, 4)];
  
  return {
    id: orderId,
    orderNo: `DD${randomInt(100000, 999999)}`,
    regionId: region.id,
    regionName: region.name,
    riderId: `rider-${randomInt(100, 999)}`,
    riderName: `骑手${randomInt(100, 999)}`,
    pickupAddress: "北京市朝阳区建国路88号",
    deliveryAddress: "北京市海淀区中关村大街1号",
    itemType: ["餐饮", "生鲜", "文件", "电子产品"][randomInt(0, 3)],
    itemValue: Math.round(randomInRange(30, 200) * 100) / 100,
    distance: Math.round(randomInRange(3, 15) * 10) / 10,
    status: ["DELIVERED", "DAMAGED", "PICKED_UP"][randomInt(0, 2)],
    statusLabel: ["已送达", "物品损坏", "已取件"][randomInt(0, 2)],
    dispatchDuration: randomInt(5, 20),
    deliveryDuration: randomInt(20, 60),
    totalDuration: randomInt(30, 80),
    orderedAt: format(subDays(new Date(), randomInt(0, 30)), "yyyy-MM-dd HH:mm:ss"),
    assignedAt: format(subDays(new Date(), randomInt(0, 30)), "yyyy-MM-dd HH:mm:ss"),
    pickedUpAt: format(subDays(new Date(), randomInt(0, 30)), "yyyy-MM-dd HH:mm:ss"),
    deliveredAt: format(subDays(new Date(), randomInt(0, 30)), "yyyy-MM-dd HH:mm:ss"),
    payment: {
      transactionNo: `ZF${randomInt(100000, 999999)}`,
      amount: Math.round(randomInRange(15, 50) * 100) / 100,
      subsidyAmount: Math.round(randomInRange(3, 15) * 100) / 100,
      baseFee: Math.round(randomInRange(8, 20) * 100) / 100,
      paymentMethod: "微信支付",
      paidAt: format(subDays(new Date(), randomInt(0, 30)), "yyyy-MM-dd HH:mm:ss"),
    },
    mapRecord: {
      routeDistance: Math.round(randomInRange(3, 15) * 10) / 10,
      estimatedDuration: randomInt(25, 50),
      actualDuration: randomInt(25, 55),
      trafficLevel: ["畅通", "缓行", "拥堵"][randomInt(0, 2)],
      weatherCondition: ["晴", "多云", "小雨"][randomInt(0, 2)],
      mapProvider: "高德地图",
      syncedAt: format(subDays(new Date(), randomInt(0, 30)), "yyyy-MM-dd HH:mm:ss"),
    },
    subsidy: {
      id: `subsidy-${randomInt(100, 999)}`,
      ruleName: "基础补贴规则",
      ruleCode: "BASE_001",
      amount: Math.round(randomInRange(5, 20) * 100) / 100,
      baseAmount: Math.round(randomInRange(3, 8) * 100) / 100,
      distanceBonus: Math.round(randomInRange(2, 8) * 100) / 100,
      timeBonus: Math.round(randomInRange(0, 5) * 100) / 100,
      otherBonus: Math.round(randomInRange(0, 2) * 100) / 100,
      subsidyDate: format(subDays(new Date(), randomInt(0, 30)), "yyyy-MM-dd"),
    },
    damage: null,
    settlement: {
      settlementNo: `JS${randomInt(100000, 999999)}`,
      status: "SETTLED",
      statusLabel: "已结算",
      baseFee: Math.round(randomInRange(8, 20) * 100) / 100,
      subsidyAmount: Math.round(randomInRange(3, 15) * 100) / 100,
      deductionAmount: 0,
      totalAmount: Math.round(randomInRange(15, 30) * 100) / 100,
      settlementDate: format(subDays(new Date(), randomInt(0, 30)), "yyyy-MM-dd"),
      settledAt: format(subDays(new Date(), randomInt(0, 30)), "yyyy-MM-dd HH:mm:ss"),
    },
  };
}
