import { PrismaClient } from "@prisma/client";
import { addDays, subDays, startOfDay, setHours } from "date-fns";

const prisma = new PrismaClient();

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 2) {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

async function main() {
  console.log("🌱 开始播种数据...");

  await prisma.syncDetail.deleteMany();
  await prisma.syncLog.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.performanceCancel.deleteMany();
  await prisma.performance.deleteMany();
  await prisma.dailyRouteStat.deleteMany();
  await prisma.dailyAreaStat.deleteMany();
  await prisma.routePoint.deleteMany();
  await prisma.cameraStat.deleteMany();
  await prisma.merchantOrder.deleteMany();
  await prisma.miniappOrder.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.miniappUser.deleteMany();
  await prisma.tourRoute.deleteMany();
  await prisma.area.deleteMany();

  console.log("✅ 旧数据清理完成");

  // 1. 创建区域
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

  const areas: any[] = [];
  for (let i = 0; i < areaData.length; i++) {
    const data = areaData[i];
    const area = await prisma.area.create({
      data: {
        id: `area-${i + 1}`,
        name: data.name,
        lng: data.lng,
        lat: data.lat,
      },
    });
    areas.push(area);
  }
  console.log(`✅ 创建了 ${areas.length} 个区域`);

  // 2. 创建商户和合同
  const merchantData = [
    { name: "西湖餐饮管理有限公司", type: "餐饮", areaIndex: 4, amount: 500000 },
    { name: "宋记食品有限公司", type: "餐饮", areaIndex: 2, amount: 300000 },
    { name: "印象文创商店", type: "购物", areaIndex: 0, amount: 200000 },
    { name: "山水纪念品店", type: "购物", areaIndex: 6, amount: 150000 },
    { name: "欢乐游乐城", type: "娱乐", areaIndex: 7, amount: 800000 },
    { name: "文化体验馆", type: "体验", areaIndex: 5, amount: 400000 },
  ];

  const merchants: any[] = [];
  for (let i = 0; i < merchantData.length; i++) {
    const data = merchantData[i];
    const merchant = await prisma.merchant.create({
      data: {
        id: `merchant-${i + 1}`,
        name: data.name,
        type: data.type,
        areaId: areas[data.areaIndex].id,
        contractAmount: data.amount,
      },
    });
    merchants.push(merchant);

    await prisma.contract.create({
      data: {
        id: `contract-${i + 1}`,
        merchantId: merchant.id,
        title: `${data.name.split("有")[0] || data.name}合作协议`,
        content: `甲乙双方本着互惠互利、共同发展的原则，经友好协商，就乙方在甲方景区内经营${data.type}业务事宜达成如下协议...`,
        startDate: new Date(),
        endDate: addDays(new Date(), 365),
        caliberNote: `本合同项下二消金额统计口径为：乙方在景区内所有门店通过POS系统、小程序、线下现金等渠道产生的全部营业收入，不含税费。`,
      },
    });
  }
  console.log(`✅ 创建了 ${merchants.length} 个商户和合同`);

  // 3. 创建导览路线和路线点
  const routeData = [
    { name: "经典游览线", color: "#06b6d4", description: "景区最受欢迎的经典游览路线", points: [0, 1, 2, 6] },
    { name: "深度体验线", color: "#f97316", description: "深度体验景区文化与美景", points: [0, 5, 1, 3, 6] },
    { name: "亲子欢乐线", color: "#10b981", description: "适合家庭亲子的欢乐路线", points: [0, 7, 4, 2] },
    { name: "文化探秘线", color: "#8b5cf6", description: "探索景区深厚文化底蕴", points: [5, 2, 0, 3] },
  ];

  const routes: any[] = [];
  for (let i = 0; i < routeData.length; i++) {
    const data = routeData[i];
    const route = await prisma.tourRoute.create({
      data: {
        id: `route-${i + 1}`,
        name: data.name,
        color: data.color,
        description: data.description,
        sortOrder: i + 1,
      },
    });
    routes.push(route);

    for (let j = 0; j < data.points.length; j++) {
      await prisma.routePoint.create({
        data: {
          id: `rp-${i + 1}-${j + 1}`,
          routeId: route.id,
          areaId: areas[data.points[j]].id,
          sequence: j + 1,
        },
      });
    }
  }
  console.log(`✅ 创建了 ${routes.length} 条导览路线`);

  // 4. 创建小程序用户
  const users: any[] = [];
  for (let i = 0; i < 50; i++) {
    const user = await prisma.miniappUser.create({
      data: {
        id: `user-${i + 1}`,
        nickname: `游客${i + 1}`,
      },
    });
    users.push(user);
  }
  console.log(`✅ 创建了 ${users.length} 个小程序用户`);

  // 5. 创建演出和座位（历史日期，落入14天统计窗口内）
  const perfData = [
    { id: "perf-1", name: "印象西湖", venue: "西湖水上剧场", totalSeats: 400, daysOffset: -7, cancelled: true },
    { id: "perf-2", name: "宋城千古情", venue: "宋城大剧院", totalSeats: 300, daysOffset: -2, cancelled: true },
    { id: "perf-3", name: "山海经奇幻秀", venue: "奇幻剧场", totalSeats: 200, daysOffset: -10, cancelled: false },
    { id: "perf-4", name: "山水实景演出", venue: "山水剧场", totalSeats: 500, daysOffset: -5, cancelled: false },
    { id: "perf-5", name: "民俗文化表演", venue: "民俗广场", totalSeats: 120, daysOffset: -1, cancelled: false },
  ];

  const performances: any[] = [];
  for (const data of perfData) {
    const startTime = setHours(addDays(startOfDay(new Date()), data.daysOffset), 19);
    const endTime = new Date(startTime.getTime() + 70 * 60 * 1000);

    const perf = await prisma.performance.create({
      data: {
        id: data.id,
        name: data.name,
        venue: data.venue,
        startTime,
        endTime,
        totalSeats: data.totalSeats,
        status: data.cancelled ? "cancelled" : "selling",
      },
    });
    performances.push(perf);

    // 创建座位
    const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const perRow = Math.ceil(data.totalSeats / rows.length);
    let created = 0;

    for (const row of rows) {
      for (let n = 1; n <= perRow && created < data.totalSeats; n++) {
        const r = Math.random();
        const status = r < 0.55 ? "sold" : r < 0.7 ? "reserved" : "available";
        const price = row <= "C" ? 388 : row <= "F" ? 288 : 188;

        await prisma.seat.create({
          data: {
            id: `seat-${perf.id}-${row}-${n}`,
            performanceId: perf.id,
            row,
            number: String(n),
            status,
            price,
            orderId:
              status === "sold"
                ? `ORD-${perf.id.slice(-1)}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
                : undefined,
          },
        });
        created++;
      }
    }

    // 如果取消，创建取消记录
    if (data.cancelled) {
      await prisma.performanceCancel.create({
        data: {
          id: `cancel-${perf.id}`,
          performanceId: perf.id,
          cancelTime: new Date(startTime.getTime() - 24 * 60 * 60 * 1000),
          reason: data.id === "perf-1" ? "受台风天气影响，为确保观众安全，演出取消" : "设备临时检修，演出取消",
          affectedCount: Math.floor(data.totalSeats * 0.75),
        },
      });
    }
  }
  console.log(`✅ 创建了 ${performances.length} 场演出及座位`);

  // 6. 创建日统计（导览路线）
  const statsDays = 14;
  for (const route of routes) {
    for (let i = 0; i < statsDays; i++) {
      const date = subDays(startOfDay(new Date()), statsDays - 1 - i);
      const base = 1500 + rand(0, 1500);
      const visitors = Math.floor(base * (0.7 + Math.random() * 0.6));
      const orders = Math.floor(visitors * (0.05 + Math.random() * 0.08));
      const spend = orders * (30 + rand(0, 80));

      await prisma.dailyRouteStat.create({
        data: {
          routeId: route.id,
          statDate: date,
          visitorCount: visitors,
          miniappOrders: orders,
          secondSpend: spend,
        },
      });
    }
  }
  console.log(`✅ 创建了路线日统计`);

  // 7. 创建日统计（区域）
  for (const area of areas) {
    for (let i = 0; i < statsDays; i++) {
      const date = subDays(startOfDay(new Date()), statsDays - 1 - i);
      const base = 800 + rand(0, 3000);
      const visitors = Math.floor(base * (0.7 + Math.random() * 0.6));
      const orders = Math.floor(visitors * (0.03 + Math.random() * 0.06));
      const amount = orders * (20 + rand(0, 70));

      await prisma.dailyAreaStat.create({
        data: {
          areaId: area.id,
          statDate: date,
          visitorCount: visitors,
          merchantOrders: orders,
          totalAmount: amount,
        },
      });
    }
  }
  console.log(`✅ 创建了区域日统计`);

  // 8. 创建商户流水（真实可同步展示）
  let merchantOrderCount = 0;
  for (const merchant of merchants) {
    for (let i = 0; i < 40; i++) {
      const orderTime = new Date(Date.now() - rand(1, statsDays * 24) * 60 * 60 * 1000);
      await prisma.merchantOrder.create({
        data: {
          id: `mo-${merchant.id}-${i}`,
          merchantId: merchant.id,
          amount: randFloat(20, 600),
          orderTime,
          source: Math.random() > 0.5 ? "offline" : "miniapp",
          status: Math.random() > 0.08 ? "paid" : "refunded",
        },
      });
      merchantOrderCount++;
    }
  }
  console.log(`✅ 创建了 ${merchantOrderCount} 条商户流水`);

  // 9. 创建小程序订单
  let miniappOrderCount = 0;
  for (let i = 0; i < 120; i++) {
    const orderTime = new Date(Date.now() - rand(1, statsDays * 24) * 60 * 60 * 1000);
    const user = users[rand(0, users.length - 1)];
    const route = routes[rand(0, routes.length - 1)];
    await prisma.miniappOrder.create({
      data: {
        id: `mio-${i + 1}`,
        userId: user.id,
        routeId: route.id,
        amount: randFloat(30, 280),
        orderTime,
        status: Math.random() > 0.12 ? "paid" : "cancelled",
      },
    });
    miniappOrderCount++;
  }
  console.log(`✅ 创建了 ${miniappOrderCount} 条小程序订单`);

  // 10. 创建摄像头统计
  let cameraCount = 0;
  for (const area of areas) {
    for (let day = 0; day < 3; day++) {
      for (let hour = 9; hour < 19; hour++) {
        await prisma.cameraStat.create({
          data: {
            id: `cam-${area.id}-${day}-${hour}`,
            cameraId: `cam-${area.id}`,
            areaId: area.id,
            visitorCount: rand(50, 350),
            statDate: subDays(startOfDay(new Date()), day),
            statHour: hour,
          },
        });
        cameraCount++;
      }
    }
  }
  console.log(`✅ 创建了 ${cameraCount} 条摄像头统计`);

  // 11. 创建同步日志（真实的历史日志）
  const sourceTypes = ["merchant", "miniapp", "camera"];
  for (let i = 0; i < 25; i++) {
    const sourceType = sourceTypes[i % 3];
    const startTime = new Date(Date.now() - rand(30, 24 * 60 * 60) * 1000);
    const fail = Math.random() < 0.1;
    const duration = rand(20, 180);
    const endTime = fail ? null : new Date(startTime.getTime() + duration * 1000);
    const count = fail ? 0 : rand(30, 300);

    const log = await prisma.syncLog.create({
      data: {
        id: `log-${i + 1}`,
        sourceType,
        startTime,
        endTime,
        status: fail ? "failed" : "success",
        recordCount: count,
        errorMessage: fail ? "API连接超时，请检查网络连接后重试" : undefined,
      },
    });

    if (!fail) {
      for (let j = 0; j < Math.min(3, count); j++) {
        await prisma.syncDetail.create({
          data: {
            syncLogId: log.id,
            recordId: `rec-${log.id}-${j + 1}`,
            action: "INSERT",
            detail: `同步记录 #${j + 1} 成功写入`,
          },
        });
      }
    }
  }
  console.log(`✅ 创建了历史同步日志`);

  console.log("\n🎉 所有数据播种完成！数据库已就绪。");
}

main()
  .catch((e) => {
    console.error("❌ 播种失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
