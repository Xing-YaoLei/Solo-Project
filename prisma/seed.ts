import { PrismaClient } from "@prisma/client";
import { addDays, subDays, startOfDay } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("开始播种数据...");

  const areas = await createAreas();
  console.log(`创建了 ${areas.length} 个区域`);

  const merchants = await createMerchants(areas);
  console.log(`创建了 ${merchants.length} 个商户`);

  const contracts = await createContracts(merchants);
  console.log(`创建了 ${contracts.length} 份合同`);

  const routes = await createTourRoutes(areas);
  console.log(`创建了 ${routes.length} 条导览路线`);

  const performances = await createPerformances();
  console.log(`创建了 ${performances.length} 场演出`);

  await createSeats(performances);
  console.log("创建了演出座位");

  await createPerformanceCancels(performances);
  console.log("创建了演出取消记录");

  await createDailyRouteStats(routes);
  console.log("创建了路线日统计");

  await createDailyAreaStats(areas);
  console.log("创建了区域日统计");

  await createSyncLogs();
  console.log("创建了同步日志");

  console.log("数据播种完成!");
}

async function createAreas() {
  const areaData = [
    { name: "主入口广场", lng: 120.1, lat: 30.2 },
    { name: "湖心岛", lng: 120.12, lat: 30.22 },
    { name: "古街区", lng: 120.08, lat: 30.18 },
    { name: "演艺中心", lng: 120.15, lat: 30.25 },
    { name: "美食街", lng: 120.11, lat: 30.19 },
    { name: "博物馆", lng: 120.09, lat: 30.23 },
    { name: "观景台", lng: 120.13, lat: 30.21 },
    { name: "儿童乐园", lng: 120.14, lat: 30.17 },
  ];

  const areas = [];
  for (const data of areaData) {
    const area = await prisma.area.upsert({
      where: { id: `area-${data.name}` },
      update: {},
      create: {
        id: `area-${data.name}`,
        name: data.name,
        lng: data.lng,
        lat: data.lat,
      },
    });
    areas.push(area);
  }
  return areas;
}

async function createMerchants(areas: any[]) {
  const merchantData = [
    { name: "西湖餐饮管理有限公司", type: "餐饮", areaIndex: 4, amount: 500000 },
    { name: "宋记食品有限公司", type: "餐饮", areaIndex: 2, amount: 300000 },
    { name: "印象文创商店", type: "购物", areaIndex: 0, amount: 200000 },
    { name: "山水纪念品店", type: "购物", areaIndex: 6, amount: 150000 },
    { name: "欢乐游乐城", type: "娱乐", areaIndex: 7, amount: 800000 },
    { name: "文化体验馆", type: "体验", areaIndex: 5, amount: 400000 },
  ];

  const merchants = [];
  for (let i = 0; i < merchantData.length; i++) {
    const data = merchantData[i];
    const merchant = await prisma.merchant.upsert({
      where: { id: `merchant-${i + 1}` },
      update: {},
      create: {
        id: `merchant-${i + 1}`,
        name: data.name,
        type: data.type,
        areaId: areas[data.areaIndex].id,
        contractAmount: data.amount,
      },
    });
    merchants.push(merchant);
  }
  return merchants;
}

async function createContracts(merchants: any[]) {
  const contracts = [];
  for (let i = 0; i < merchants.length; i++) {
    const merchant = merchants[i];
    const contract = await prisma.contract.upsert({
      where: { merchantId: merchant.id },
      update: {},
      create: {
        id: `contract-${i + 1}`,
        merchantId: merchant.id,
        title: `${merchant.name.split("有")[0]}合作协议`,
        content: `甲乙双方本着互惠互利、共同发展的原则，经友好协商，就乙方在甲方景区内经营${merchant.type}业务事宜达成如下协议...`,
        startDate: new Date(),
        endDate: addDays(new Date(), 365),
        caliberNote: `本合同项下二消金额统计口径为：乙方在景区内所有门店通过POS系统、小程序、线下现金等渠道产生的全部营业收入，不含税费。`,
      },
    });
    contracts.push(contract);
  }
  return contracts;
}

async function createTourRoutes(areas: any[]) {
  const routeData = [
    { name: "经典游览线", color: "#06b6d4", description: "景区最受欢迎的经典游览路线", points: [0, 1, 2, 6] },
    { name: "深度体验线", color: "#f97316", description: "深度体验景区文化与美景", points: [0, 5, 1, 3, 6] },
    { name: "亲子欢乐线", color: "#10b981", description: "适合家庭亲子的欢乐路线", points: [0, 7, 4, 2] },
    { name: "文化探秘线", color: "#8b5cf6", description: "探索景区深厚文化底蕴", points: [5, 2, 0, 3] },
  ];

  const routes = [];
  for (let i = 0; i < routeData.length; i++) {
    const data = routeData[i];
    const route = await prisma.tourRoute.upsert({
      where: { id: `route-${i + 1}` },
      update: {},
      create: {
        id: `route-${i + 1}`,
        name: data.name,
        color: data.color,
        description: data.description,
        sortOrder: i + 1,
      },
    });

    for (let j = 0; j < data.points.length; j++) {
      await prisma.routePoint.upsert({
        where: { id: `routepoint-${i + 1}-${j}` },
        update: {},
        create: {
          id: `routepoint-${i + 1}-${j}`,
          routeId: route.id,
          areaId: areas[data.points[j]].id,
          sequence: j + 1,
        },
      });
    }

    routes.push(route);
  }
  return routes;
}

async function createPerformances() {
  const perfData = [
    { name: "印象西湖", venue: "西湖水上剧场", totalSeats: 1500, daysOffset: 0 },
    { name: "宋城千古情", venue: "宋城大剧院", totalSeats: 800, daysOffset: 1 },
    { name: "山海经奇幻秀", venue: "奇幻剧场", totalSeats: 600, daysOffset: 2 },
    { name: "山水实景演出", venue: "山水剧场", totalSeats: 2000, daysOffset: 3 },
    { name: "民俗文化表演", venue: "民俗广场", totalSeats: 400, daysOffset: 4 },
  ];

  const performances = [];
  for (let i = 0; i < perfData.length; i++) {
    const data = perfData[i];
    const startTime = addDays(new Date(), data.daysOffset);
    startTime.setHours(19, 30, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(20, 40, 0, 0);

    const perf = await prisma.performance.upsert({
      where: { id: `perf-${i + 1}` },
      update: {},
      create: {
        id: `perf-${i + 1}`,
        name: data.name,
        venue: data.venue,
        startTime,
        endTime,
        totalSeats: data.totalSeats,
        status: i === 0 ? "cancelled" : "selling",
      },
    });
    performances.push(perf);
  }
  return performances;
}

async function createSeats(performances: any[]) {
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

  for (const perf of performances) {
    const seatsPerRow = Math.floor(perf.totalSeats / rows.length);
    let seatIndex = 0;

    for (const row of rows) {
      for (let i = 1; i <= seatsPerRow; i++) {
        seatIndex++;
        if (seatIndex > perf.totalSeats) break;

        const random = Math.random();
        let status = "available";
        if (random < 0.6) status = "sold";
        else if (random < 0.75) status = "reserved";

        const price = row <= "C" ? 388 : row <= "F" ? 288 : 188;

        await prisma.seat.upsert({
          where: { id: `seat-${perf.id}-${row}-${i}` },
          update: {},
          create: {
            id: `seat-${perf.id}-${row}-${i}`,
            performanceId: perf.id,
            row,
            number: String(i),
            status,
            price,
            orderId:
              status === "sold"
                ? `ORD-${perf.id}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
                : undefined,
          },
        });
      }
    }
  }
}

async function createPerformanceCancels(performances: any[]) {
  const cancelledPerf = performances[0];
  const cancelTime = subDays(new Date(cancelledPerf.startTime), 1);

  await prisma.performanceCancel.upsert({
    where: { id: "cancel-1" },
    update: {},
    create: {
      id: "cancel-1",
      performanceId: cancelledPerf.id,
      cancelTime,
      reason: "受台风天气影响，为确保观众安全，演出取消",
      affectedCount: 1200,
    },
  });
}

async function createDailyRouteStats(routes: any[]) {
  const days = 14;

  for (const route of routes) {
    for (let i = 0; i < days; i++) {
      const date = subDays(startOfDay(new Date()), days - 1 - i);
      const baseVisitors = 2000 + Math.floor(Math.random() * 3000);
      const visitors = Math.floor(baseVisitors * (0.8 + Math.random() * 0.4));
      const orders = Math.floor(visitors * (0.1 + Math.random() * 0.1));
      const spend = orders * (50 + Math.floor(Math.random() * 100));

      await prisma.dailyRouteStat.upsert({
        where: {
          routeId_statDate: {
            routeId: route.id,
            statDate: date,
          },
        },
        update: {},
        create: {
          routeId: route.id,
          statDate: date,
          visitorCount: visitors,
          miniappOrders: orders,
          secondSpend: spend,
        },
      });
    }
  }
}

async function createDailyAreaStats(areas: any[]) {
  const days = 14;

  for (const area of areas) {
    for (let i = 0; i < days; i++) {
      const date = subDays(startOfDay(new Date()), days - 1 - i);
      const baseVisitors = 1000 + Math.floor(Math.random() * 5000);
      const visitors = Math.floor(baseVisitors * (0.8 + Math.random() * 0.4));
      const orders = Math.floor(visitors * (0.05 + Math.random() * 0.1));
      const amount = orders * (30 + Math.floor(Math.random() * 80));

      await prisma.dailyAreaStat.upsert({
        where: {
          areaId_statDate: {
            areaId: area.id,
            statDate: date,
          },
        },
        update: {},
        create: {
          areaId: area.id,
          statDate: date,
          visitorCount: visitors,
          merchantOrders: orders,
          totalAmount: amount,
        },
      });
    }
  }
}

async function createSyncLogs() {
  const sourceTypes = ["merchant", "miniapp", "camera"];

  for (let i = 0; i < 20; i++) {
    const sourceType = sourceTypes[i % 3];
    const startTime = subDays(new Date(), Math.floor(i / 3));
    startTime.setHours(10 + (i % 5), (i * 7) % 60, 0, 0);

    const success = Math.random() > 0.15;
    const duration = 30 + Math.floor(Math.random() * 120);
    const endTime = new Date(startTime.getTime() + duration * 1000);

    const log = await prisma.syncLog.create({
      data: {
        sourceType,
        startTime,
        endTime: success ? endTime : null,
        status: success ? "success" : "failed",
        recordCount: success ? Math.floor(Math.random() * 500) : 0,
        errorMessage: success
          ? undefined
          : "API连接超时，请检查网络连接",
      },
    });

    if (success) {
      for (let j = 0; j < 3; j++) {
        await prisma.syncDetail.create({
          data: {
            syncLogId: log.id,
            recordId: `record-${log.id}-${j}`,
            action: "INSERT",
            detail: `同步记录 ${j} 成功`,
          },
        });
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
