import { PrismaClient, OrderStatus, SyncSource, SyncStatus, DamageSeverity, AppealStatus, SettlementStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";

const prisma = new PrismaClient();

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
  return Math.floor(randomInRange(min, max + 1));
}

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const regionData = [
  { name: "朝阳区", code: "BJ-CY", city: "北京", province: "北京市" },
  { name: "海淀区", code: "BJ-HD", city: "北京", province: "北京市" },
  { name: "东城区", code: "BJ-DC", city: "北京", province: "北京市" },
  { name: "西城区", code: "BJ-XC", city: "北京", province: "北京市" },
  { name: "丰台区", code: "BJ-FT", city: "北京", province: "北京市" },
];

const subsidyRuleData = [
  {
    ruleName: "基础补贴规则",
    ruleCode: "BASE_001",
    description: "基础配送补贴，按距离计算",
    subsidyType: "DISTANCE",
    baseAmount: 5.0,
    distanceMultiplier: 1.5,
    timeMultiplier: null,
    minAmount: 3.0,
    maxAmount: 20.0,
  },
  {
    ruleName: "高峰时段补贴",
    ruleCode: "PEAK_001",
    description: "午晚高峰时段额外补贴",
    subsidyType: "TIME",
    baseAmount: 3.0,
    distanceMultiplier: null,
    timeMultiplier: 2.0,
    minAmount: 2.0,
    maxAmount: 10.0,
  },
  {
    ruleName: "恶劣天气补贴",
    ruleCode: "WEATHER_001",
    description: "恶劣天气额外补贴",
    subsidyType: "WEATHER",
    baseAmount: 5.0,
    distanceMultiplier: 0.5,
    timeMultiplier: null,
    minAmount: 3.0,
    maxAmount: 15.0,
  },
];

const itemTypes = ["餐饮", "生鲜", "文件", "药品", "日用品", "电子产品", "服装"];
const paymentMethods = ["微信支付", "支付宝", "银行卡", "余额支付"];
const trafficLevels = ["畅通", "缓行", "拥堵", "严重拥堵"];
const weatherConditions = ["晴", "多云", "阴", "小雨", "中雨", "大雨", "雪"];
const mapProviders = ["高德地图", "百度地图", "腾讯地图"];
const riderNames = Array.from({ length: 50 }, (_, i) => `骑手${i + 1}`);
const addresses = [
  "北京市朝阳区建国路88号",
  "北京市海淀区中关村大街1号",
  "北京市东城区王府井大街138号",
  "北京市西城区西单北大街120号",
  "北京市丰台区丰台路5号",
  "北京市朝阳区三里屯路19号",
  "北京市海淀区颐和园路",
  "北京市东城区东单北大街",
  "北京市西城区西直门外大街",
  "北京市丰台区南三环西路",
];

async function main() {
  console.log("开始播种数据...");

  console.log("清理现有数据...");
  await prisma.appealEvidence.deleteMany();
  await prisma.compensationRecord.deleteMany();
  await prisma.damageRecord.deleteMany();
  await prisma.settlementDetail.deleteMany();
  await prisma.subsidyRecord.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.mapRecord.deleteMany();
  await prisma.order.deleteMany();
  await prisma.syncBatch.deleteMany();
  await prisma.subsidyRule.deleteMany();
  await prisma.region.deleteMany();

  console.log("创建区域数据...");
  const regions = await Promise.all(
    regionData.map((r) =>
      prisma.region.create({
        data: r,
      })
    )
  );

  console.log("创建补贴规则...");
  const rules = await Promise.all(
    subsidyRuleData.map((r) =>
      prisma.subsidyRule.create({
        data: {
          ...r,
          baseAmount: new Prisma.Decimal(r.baseAmount),
          distanceMultiplier: r.distanceMultiplier ? new Prisma.Decimal(r.distanceMultiplier) : null,
          timeMultiplier: r.timeMultiplier ? new Prisma.Decimal(r.timeMultiplier) : null,
          minAmount: r.minAmount ? new Prisma.Decimal(r.minAmount) : null,
          maxAmount: r.maxAmount ? new Prisma.Decimal(r.maxAmount) : null,
          effectiveFrom: new Date("2024-01-01"),
        },
      })
    )
  );

  const now = new Date();

  console.log("创建订单系统同步批次...");
  for (let batchIdx = 0; batchIdx < 6; batchIdx++) {
    const batchDate = new Date(now);
    batchDate.setDate(batchDate.getDate() - batchIdx * 3);

    const batchNumber = `ORDER_SYSTEM-${batchDate.getTime()}-${Math.random().toString(36).substr(2, 9)}`;
    const orderCount = randomInt(20, 50);

    const batch = await prisma.syncBatch.create({
      data: {
        batchNumber,
        source: SyncSource.ORDER_SYSTEM,
        status: batchIdx === 0 ? SyncStatus.RUNNING : batchIdx === 1 ? SyncStatus.FAILED : SyncStatus.SUCCESS,
        totalCount: orderCount,
        successCount: batchIdx === 1 ? 0 : orderCount - randomInt(0, 3),
        failedCount: batchIdx === 1 ? orderCount : randomInt(0, 3),
        startedAt: new Date(batchDate.getTime() - 3600000),
        completedAt: batchIdx === 0 ? null : new Date(batchDate.getTime() - 1800000),
        errorMessage: batchIdx === 1 ? "订单系统连接超时" : null,
      },
    });

    if (batchIdx !== 1) {
      const orderPromises = [];
      for (let i = 0; i < orderCount; i++) {
        const region = randomFromArray(regions);
        const orderedAt = new Date(batchDate);
        orderedAt.setHours(randomInt(8, 20), randomInt(0, 59));

        const statuses = [OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.PICKED_UP, OrderStatus.ASSIGNED, OrderStatus.PENDING];
        const status = randomFromArray(statuses);

        const dispatchDuration = randomInt(5, 30);
        const deliveryDuration = randomInt(20, 60);
        const totalDuration = dispatchDuration + deliveryDuration;

        const orderedAtDate = new Date(orderedAt);
        const assignedAt = new Date(orderedAtDate.getTime() + dispatchDuration * 60000);
        const pickedUpAt = new Date(assignedAt.getTime() + randomInt(5, 15) * 60000);
        const deliveredAt = status === OrderStatus.DELIVERED
          ? new Date(orderedAtDate.getTime() + totalDuration * 60000)
          : null;

        orderPromises.push(
          prisma.order.create({
            data: {
              orderNo: `DD${randomInt(100000, 999999)}`,
              regionId: region.id,
              riderId: `rider-${randomInt(1, 50)}`,
              riderName: randomFromArray(riderNames),
              pickupAddress: randomFromArray(addresses),
              deliveryAddress: randomFromArray(addresses),
              itemType: randomFromArray(itemTypes),
              itemValue: new Prisma.Decimal(randomInRange(20, 200).toFixed(2)),
              distance: new Prisma.Decimal(randomInRange(1, 15).toFixed(2)),
              status,
              dispatchDuration,
              deliveryDuration,
              totalDuration,
              orderedAt: orderedAtDate,
              assignedAt: status !== OrderStatus.PENDING ? assignedAt : null,
              pickedUpAt: status === OrderStatus.PICKED_UP || status === OrderStatus.DELIVERED ? pickedUpAt : null,
              deliveredAt: deliveredAt,
              syncBatchId: batch.id,
            },
          })
        );
      }
      await Promise.all(orderPromises);
    }
  }

  console.log("创建支付系统同步批次...");
  const allDeliveredOrders = await prisma.order.findMany({
    where: { status: OrderStatus.DELIVERED },
    orderBy: { createdAt: "desc" },
  });

  let paymentOrderIndex = 0;
  const paymentBatches = [
    { count: 30, status: SyncStatus.SUCCESS },
    { count: 25, status: SyncStatus.SUCCESS },
    { count: 20, status: SyncStatus.PARTIAL },
    { count: 15, status: SyncStatus.SUCCESS },
    { count: 10, status: SyncStatus.SUCCESS },
  ];

  for (let batchIdx = 0; batchIdx < paymentBatches.length; batchIdx++) {
    const batchDate = new Date(now);
    batchDate.setDate(batchDate.getDate() - batchIdx * 4);
    const batch = paymentBatches[batchIdx];

    const batchNumber = `PAYMENT_SYSTEM-${batchDate.getTime()}-${Math.random().toString(36).substr(2, 9)}`;
    const batchOrders = allDeliveredOrders.slice(paymentOrderIndex, paymentOrderIndex + batch.count);
    paymentOrderIndex += batch.count;

    const successCount = batch.status === SyncStatus.PARTIAL
      ? batch.count - randomInt(1, 5)
      : batch.count;
    const failedCount = batch.count - successCount;

    await prisma.syncBatch.create({
      data: {
        batchNumber,
        source: SyncSource.PAYMENT_SYSTEM,
        status: batch.status,
        totalCount: batch.count,
        successCount,
        failedCount,
        startedAt: new Date(batchDate.getTime() - 7200000),
        completedAt: new Date(batchDate.getTime() - 3600000),
        errorMessage: batch.status === SyncStatus.PARTIAL ? "部分支付记录同步失败" : null,
        paymentTransactions: {
          create: batchOrders.slice(0, successCount).map((order) => ({
            transactionNo: `TX${randomInt(1000000, 9999999)}`,
            orderId: order.id,
            amount: new Prisma.Decimal((order.itemValue.toNumber() + randomInRange(5, 15)).toFixed(2)),
            subsidyAmount: new Prisma.Decimal(randomInRange(3, 15).toFixed(2)),
            baseFee: new Prisma.Decimal(randomInRange(5, 10).toFixed(2)),
            paymentMethod: randomFromArray(paymentMethods),
            paidAt: new Date(batchDate.getTime() - randomInt(1800, 3600) * 1000),
          })),
        },
      },
    });
  }

  console.log("创建地图接口同步批次...");
  const allOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
  });

  let mapOrderIndex = 0;
  const mapBatches = [
    { count: 35, status: SyncStatus.SUCCESS },
    { count: 30, status: SyncStatus.SUCCESS },
    { count: 25, status: SyncStatus.SUCCESS },
    { count: 20, status: SyncStatus.SUCCESS },
    { count: 15, status: SyncStatus.SUCCESS },
    { count: 12, status: SyncStatus.SUCCESS },
    { count: 10, status: SyncStatus.SUCCESS },
    { count: 8, status: SyncStatus.SUCCESS },
    { count: 5, status: SyncStatus.SUCCESS },
  ];

  for (let batchIdx = 0; batchIdx < mapBatches.length; batchIdx++) {
    const batchDate = new Date(now);
    batchDate.setDate(batchDate.getDate() - batchIdx * 2);
    const batch = mapBatches[batchIdx];

    const batchNumber = `MAP_API-${batchDate.getTime()}-${Math.random().toString(36).substr(2, 9)}`;
    const batchOrders = allOrders.slice(mapOrderIndex, mapOrderIndex + batch.count);
    mapOrderIndex += batch.count;

    await prisma.syncBatch.create({
      data: {
        batchNumber,
        source: SyncSource.MAP_API,
        status: batch.status,
        totalCount: batch.count,
        successCount: batch.count,
        failedCount: 0,
        startedAt: new Date(batchDate.getTime() - 1800000),
        completedAt: new Date(batchDate.getTime() - 900000),
        mapRecords: {
          create: batchOrders.map((order) => ({
            orderId: order.id,
            routeDistance: new Prisma.Decimal((order.distance.toNumber() + randomInRange(-0.5, 1)).toFixed(2)),
            estimatedDuration: randomInt(20, 50),
            actualDuration: order.totalDuration,
            trafficLevel: randomFromArray(trafficLevels),
            weatherCondition: randomFromArray(weatherConditions),
            mapProvider: randomFromArray(mapProviders),
            syncedAt: new Date(batchDate.getTime() - randomInt(600, 1800) * 1000),
          })),
        },
      },
    });
  }

  console.log("创建补贴记录...");
  const deliveredOrders = await prisma.order.findMany({
    where: { status: OrderStatus.DELIVERED },
    include: { region: true },
  });

  for (const order of deliveredOrders.slice(0, 30)) {
    const rule = randomFromArray(rules);
    const baseAmount = randomInRange(3, 8);
    const distanceBonus = randomInRange(1, 5);
    const timeBonus = randomInRange(0, 3);
    const otherBonus = randomInRange(0, 2);
    const totalAmount = baseAmount + distanceBonus + timeBonus + otherBonus;

    await prisma.subsidyRecord.create({
      data: {
        orderId: order.id,
        ruleId: rule.id,
        regionId: order.regionId,
        amount: new Prisma.Decimal(totalAmount.toFixed(2)),
        baseAmount: new Prisma.Decimal(baseAmount.toFixed(2)),
        distanceBonus: new Prisma.Decimal(distanceBonus.toFixed(2)),
        timeBonus: new Prisma.Decimal(timeBonus.toFixed(2)),
        otherBonus: new Prisma.Decimal(otherBonus.toFixed(2)),
        subsidyDate: order.orderedAt,
      },
    });
  }

  console.log("创建损坏记录...");
  const damageOrders = deliveredOrders.slice(0, 15);
  for (let i = 0; i < damageOrders.length; i++) {
    const order = damageOrders[i];
    const severities = [DamageSeverity.MINOR, DamageSeverity.MODERATE, DamageSeverity.SEVERE, DamageSeverity.TOTAL_LOSS];
    const severity = randomFromArray(severities);
    const hasCompensation = Math.random() > 0.3;

    const damageRecord = await prisma.damageRecord.create({
      data: {
        orderId: order.id,
        severity,
        description: `配送过程中物品受到${severity === DamageSeverity.MINOR ? "轻微" : severity === DamageSeverity.MODERATE ? "中度" : severity === DamageSeverity.SEVERE ? "严重" : "完全"}损坏`,
        damageItems: randomFromArray(["外包装", "内物", "全部物品", "部分物品"]),
        estimatedLoss: new Prisma.Decimal(randomInRange(20, 200).toFixed(2)),
        photoUrls: [
          "https://picsum.photos/200/200?random=1",
          "https://picsum.photos/200/200?random=2",
          "https://picsum.photos/200/200?random=3",
        ],
        reportedAt: new Date(order.orderedAt.getTime() + randomInt(30, 120) * 60000),
        reportedBy: randomFromArray(riderNames),
      },
    });

    if (hasCompensation) {
      await prisma.compensationRecord.create({
        data: {
          damageId: damageRecord.id,
          orderId: order.id,
          amount: new Prisma.Decimal(randomInRange(20, 150).toFixed(2)),
          compensationType: randomFromArray(["全额赔付", "部分赔付", "代金券赔付"]),
          description: "根据赔付规则进行赔付",
          paidAt: new Date(order.orderedAt.getTime() + randomInt(1440, 2880) * 60000),
          caliberNote: `按照${severity === DamageSeverity.MINOR ? "轻微" : severity === DamageSeverity.MODERATE ? "中度" : severity === DamageSeverity.SEVERE ? "严重" : "全损"}损坏赔付标准，根据物品价值和损坏程度核算赔付金额`,
        },
      });
    }
  }

  console.log("创建申诉证据...");
  const subsidies = await prisma.subsidyRecord.findMany({ take: 20 });
  for (let i = 0; i < subsidies.length; i++) {
    const subsidy = subsidies[i];
    if (Math.random() > 0.6) continue;

    const statuses = [AppealStatus.PENDING, AppealStatus.APPROVED, AppealStatus.REJECTED];
    const status = randomFromArray(statuses);

    await prisma.appealEvidence.create({
      data: {
        subsidyId: subsidy.id,
        status,
        reason: randomFromArray(["补贴金额计算有误", "配送距离不符", "订单状态异常", "其他原因"]),
        evidenceUrls: [
          "https://picsum.photos/300/200?random=10",
          "https://picsum.photos/300/200?random=11",
        ],
        submittedAt: new Date(subsidy.subsidyDate.getTime() + randomInt(60, 300) * 60000),
        reviewedAt: status !== AppealStatus.PENDING ? new Date(subsidy.subsidyDate.getTime() + randomInt(300, 600) * 60000) : null,
        reviewedBy: status !== AppealStatus.PENDING ? `审核员${randomInt(1, 10)}` : null,
        reviewNote: status === AppealStatus.APPROVED ? "申诉成立，已调整补贴金额" : status === AppealStatus.REJECTED ? "申诉不成立，维持原补贴金额" : null,
      },
    });
  }

  console.log("创建结算明细...");
  for (let i = 0; i < 30; i++) {
    const order = deliveredOrders[i];
    if (!order) continue;

    const statuses = [SettlementStatus.SETTLED, SettlementStatus.SETTLED, SettlementStatus.PENDING, SettlementStatus.ADJUSTED];
    const status = randomFromArray(statuses);
    const baseFee = randomInRange(5, 15);
    const subsidyAmount = randomInRange(3, 12);
    const deductionAmount = randomInRange(0, 2);
    const totalAmount = baseFee + subsidyAmount - deductionAmount;

    await prisma.settlementDetail.create({
      data: {
        settlementNo: `JS${randomInt(100000, 999999)}`,
        orderId: order.id,
        status,
        baseFee: new Prisma.Decimal(baseFee.toFixed(2)),
        subsidyAmount: new Prisma.Decimal(subsidyAmount.toFixed(2)),
        deductionAmount: new Prisma.Decimal(deductionAmount.toFixed(2)),
        totalAmount: new Prisma.Decimal(totalAmount.toFixed(2)),
        settlementDate: order.orderedAt,
        settledAt: status === SettlementStatus.SETTLED || status === SettlementStatus.ADJUSTED
          ? new Date(order.orderedAt.getTime() + randomInt(1440, 2880) * 60000)
          : null,
        remark: status === SettlementStatus.ADJUSTED ? "申诉调整" : null,
      },
    });
  }

  console.log("数据播种完成！");
  console.log(`- 区域: ${regions.length} 个`);
  console.log(`- 补贴规则: ${rules.length} 条`);
  console.log(`- 同步批次: ${await prisma.syncBatch.count()} 个`);
  console.log(`- 订单: ${await prisma.order.count()} 个`);
  console.log(`- 支付记录: ${await prisma.paymentTransaction.count()} 条`);
  console.log(`- 地图记录: ${await prisma.mapRecord.count()} 条`);
  console.log(`- 补贴记录: ${await prisma.subsidyRecord.count()} 条`);
  console.log(`- 损坏记录: ${await prisma.damageRecord.count()} 条`);
  console.log(`- 赔付记录: ${await prisma.compensationRecord.count()} 条`);
  console.log(`- 申诉证据: ${await prisma.appealEvidence.count()} 条`);
  console.log(`- 结算明细: ${await prisma.settlementDetail.count()} 条`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
