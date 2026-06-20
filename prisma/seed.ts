import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  const scenicArea = await prisma.scenicArea.create({
    data: {
      name: "青山湖景区",
      location: "浙江省杭州市临安区青山湖街道",
    },
  })
  console.log(`Created scenic area: ${scenicArea.name}`)

  const route1 = await prisma.guideRoute.create({
    data: {
      name: "环湖经典路线",
      description: "沿青山湖环湖步道，途经碧波观景台、渔家风味餐厅、青山古寺等核心景点",
      totalStops: 8,
      estimatedDuration: 180,
      scenicAreaId: scenicArea.id,
    },
  })

  const route1Stops = await prisma.routeStop.createMany({
    data: [
      { routeId: route1.id, stopOrder: 1, name: "东门入口", type: "POINT_OF_INTEREST", longitude: 119.7210, latitude: 30.2590, capacity: 500 },
      { routeId: route1.id, stopOrder: 2, name: "碧波观景台", type: "POINT_OF_INTEREST", longitude: 119.7240, latitude: 30.2610, capacity: 200 },
      { routeId: route1.id, stopOrder: 3, name: "湖畔休息区", type: "REST_AREA", longitude: 119.7270, latitude: 30.2600, capacity: 150 },
      { routeId: route1.id, stopOrder: 4, name: "渔家风味餐厅", type: "MERCHANT", longitude: 119.7290, latitude: 30.2580, capacity: 120 },
      { routeId: route1.id, stopOrder: 5, name: "青山古寺", type: "POINT_OF_INTEREST", longitude: 119.7310, latitude: 30.2560, capacity: 300 },
      { routeId: route1.id, stopOrder: 6, name: "渔家文化广场", type: "PERFORMANCE_VENUE", longitude: 119.7280, latitude: 30.2550, capacity: 400 },
      { routeId: route1.id, stopOrder: 7, name: "竹海栈道", type: "POINT_OF_INTEREST", longitude: 119.7260, latitude: 30.2530, capacity: 250 },
      { routeId: route1.id, stopOrder: 8, name: "东门出口", type: "REST_AREA", longitude: 119.7220, latitude: 30.2580, capacity: 300 },
    ],
  })
  console.log(`Created route: ${route1.name} with ${route1Stops.count} stops`)

  const route2 = await prisma.guideRoute.create({
    data: {
      name: "亲子游乐路线",
      description: "适合家庭亲子游，途经儿童乐园、湿地科普馆、观鸟平台等互动体验区",
      totalStops: 7,
      estimatedDuration: 150,
      scenicAreaId: scenicArea.id,
    },
  })

  const route2Stops = await prisma.routeStop.createMany({
    data: [
      { routeId: route2.id, stopOrder: 1, name: "南门入口", type: "POINT_OF_INTEREST", longitude: 119.7180, latitude: 30.2540, capacity: 400 },
      { routeId: route2.id, stopOrder: 2, name: "儿童乐园", type: "POINT_OF_INTEREST", longitude: 119.7200, latitude: 30.2520, capacity: 300 },
      { routeId: route2.id, stopOrder: 3, name: "亲子餐厅", type: "MERCHANT", longitude: 119.7220, latitude: 30.2510, capacity: 100 },
      { routeId: route2.id, stopOrder: 4, name: "湿地科普馆", type: "PERFORMANCE_VENUE", longitude: 119.7240, latitude: 30.2490, capacity: 200 },
      { routeId: route2.id, stopOrder: 5, name: "观鸟平台", type: "POINT_OF_INTEREST", longitude: 119.7260, latitude: 30.2480, capacity: 80 },
      { routeId: route2.id, stopOrder: 6, name: "竹筏漂流体验中心", type: "MERCHANT", longitude: 119.7230, latitude: 30.2500, capacity: 60 },
      { routeId: route2.id, stopOrder: 7, name: "南门出口", type: "REST_AREA", longitude: 119.7185, latitude: 30.2535, capacity: 300 },
    ],
  })
  console.log(`Created route: ${route2.name} with ${route2Stops.count} stops`)

  const stops = await prisma.routeStop.findMany({ where: { routeId: route1.id } })
  const stopMap = Object.fromEntries(stops.map((s) => [s.name, s.id]))

  const stops2 = await prisma.routeStop.findMany({ where: { routeId: route2.id } })
  const stop2Map = Object.fromEntries(stops2.map((s) => [s.name, s.id]))

  await prisma.miniProgramOrder.createMany({
    data: [
      { scenicAreaId: scenicArea.id, routeId: route1.id, orderNo: "QS20260615001", visitorCount: 2, totalAmount: 128.00, orderTime: new Date("2026-06-15T09:30:00"), visitDate: new Date("2026-06-15"), status: "COMPLETED", source: "WECHAT" },
      { scenicAreaId: scenicArea.id, routeId: route1.id, orderNo: "QS20260615002", visitorCount: 4, totalAmount: 256.00, orderTime: new Date("2026-06-15T10:15:00"), visitDate: new Date("2026-06-15"), status: "COMPLETED", source: "ALIPAY" },
      { scenicAreaId: scenicArea.id, routeId: route1.id, orderNo: "QS20260615003", visitorCount: 1, totalAmount: 88.00, orderTime: new Date("2026-06-15T11:00:00"), visitDate: new Date("2026-06-15"), status: "CONFIRMED", source: "WECHAT" },
      { scenicAreaId: scenicArea.id, routeId: route2.id, orderNo: "QS20260615004", visitorCount: 3, totalAmount: 168.00, orderTime: new Date("2026-06-15T11:45:00"), visitDate: new Date("2026-06-15"), status: "CANCELLED", source: "ALIPAY" },
      { scenicAreaId: scenicArea.id, routeId: route2.id, orderNo: "QS20260615005", visitorCount: 5, totalAmount: 320.00, orderTime: new Date("2026-06-15T12:30:00"), visitDate: new Date("2026-06-15"), status: "CANCELLED", source: "WECHAT" },
      { scenicAreaId: scenicArea.id, routeId: route1.id, orderNo: "QS20260615006", visitorCount: 1, totalAmount: 56.00, orderTime: new Date("2026-06-15T13:00:00"), visitDate: new Date("2026-06-15"), status: "PENDING", source: "OFFLINE" },
      { scenicAreaId: scenicArea.id, routeId: route1.id, orderNo: "QS20260615007", visitorCount: 3, totalAmount: 198.00, orderTime: new Date("2026-06-15T14:20:00"), visitDate: new Date("2026-06-15"), status: "COMPLETED", source: "ALIPAY" },
      { scenicAreaId: scenicArea.id, routeId: route2.id, orderNo: "QS20260615008", visitorCount: 2, totalAmount: 76.00, orderTime: new Date("2026-06-15T15:10:00"), visitDate: new Date("2026-06-15"), status: "COMPLETED", source: "WECHAT" },
      { scenicAreaId: scenicArea.id, routeId: route1.id, orderNo: "QS20260616001", visitorCount: 2, totalAmount: 148.00, orderTime: new Date("2026-06-16T09:00:00"), visitDate: new Date("2026-06-16"), status: "COMPLETED", source: "OFFLINE" },
      { scenicAreaId: scenicArea.id, routeId: route2.id, orderNo: "QS20260616002", visitorCount: 4, totalAmount: 228.00, orderTime: new Date("2026-06-16T10:30:00"), visitDate: new Date("2026-06-16"), status: "CONFIRMED", source: "WECHAT" },
    ],
  })
  console.log("Created mini-program orders")

  await prisma.merchantTransaction.createMany({
    data: [
      { scenicAreaId: scenicArea.id, stopId: stopMap["渔家风味餐厅"], merchantName: "渔家风味餐厅", transactionNo: "TX20260615001", amount: 3580.00, transactionTime: new Date("2026-06-15T12:00:00"), category: "FOOD" },
      { scenicAreaId: scenicArea.id, stopId: stop2Map["亲子餐厅"], merchantName: "亲子餐厅", transactionNo: "TX20260615002", amount: 2140.00, transactionTime: new Date("2026-06-15T12:30:00"), category: "FOOD" },
      { scenicAreaId: scenicArea.id, stopId: null, merchantName: "青山文创店", transactionNo: "TX20260615003", amount: 1890.00, transactionTime: new Date("2026-06-15T14:00:00"), category: "SOUVENIR" },
      { scenicAreaId: scenicArea.id, stopId: stop2Map["竹筏漂流体验中心"], merchantName: "竹筏漂流体验中心", transactionNo: "TX20260615004", amount: 3200.00, transactionTime: new Date("2026-06-15T11:00:00"), category: "EXPERIENCE" },
      { scenicAreaId: scenicArea.id, stopId: null, merchantName: "湖畔自行车租赁", transactionNo: "TX20260615005", amount: 960.00, transactionTime: new Date("2026-06-15T10:00:00"), category: "OTHER" },
      { scenicAreaId: scenicArea.id, stopId: stopMap["渔家风味餐厅"], merchantName: "渔家风味餐厅", transactionNo: "TX20260616001", amount: 2980.00, transactionTime: new Date("2026-06-16T12:00:00"), category: "FOOD" },
      { scenicAreaId: scenicArea.id, stopId: stop2Map["亲子餐厅"], merchantName: "亲子餐厅", transactionNo: "TX20260616002", amount: 1860.00, transactionTime: new Date("2026-06-16T12:30:00"), category: "FOOD" },
      { scenicAreaId: scenicArea.id, stopId: null, merchantName: "青山文创店", transactionNo: "TX20260616003", amount: 1450.00, transactionTime: new Date("2026-06-16T14:00:00"), category: "SOUVENIR" },
    ],
  })
  console.log("Created merchant transactions")

  await prisma.cameraStatistic.createMany({
    data: [
      { scenicAreaId: scenicArea.id, stopId: stopMap["东门入口"], cameraId: "CAM-E01", recordedAt: new Date("2026-06-15T09:00:00"), visitorCount: 42, congestionLevel: "LOW", avgStayMinutes: 3.2 },
      { scenicAreaId: scenicArea.id, stopId: stopMap["碧波观景台"], cameraId: "CAM-E02", recordedAt: new Date("2026-06-15T10:00:00"), visitorCount: 186, congestionLevel: "MEDIUM", avgStayMinutes: 12.5 },
      { scenicAreaId: scenicArea.id, stopId: stopMap["青山古寺"], cameraId: "CAM-E03", recordedAt: new Date("2026-06-15T11:00:00"), visitorCount: 423, congestionLevel: "HIGH", avgStayMinutes: 28.3 },
      { scenicAreaId: scenicArea.id, stopId: stopMap["竹海栈道"], cameraId: "CAM-E04", recordedAt: new Date("2026-06-15T14:00:00"), visitorCount: 789, congestionLevel: "CRITICAL", avgStayMinutes: 45.6 },
      { scenicAreaId: scenicArea.id, stopId: stop2Map["南门入口"], cameraId: "CAM-S01", recordedAt: new Date("2026-06-15T09:00:00"), visitorCount: 65, congestionLevel: "LOW", avgStayMinutes: 4.1 },
      { scenicAreaId: scenicArea.id, stopId: stop2Map["儿童乐园"], cameraId: "CAM-S02", recordedAt: new Date("2026-06-15T10:30:00"), visitorCount: 210, congestionLevel: "MEDIUM", avgStayMinutes: 35.2 },
      { scenicAreaId: scenicArea.id, stopId: stop2Map["湿地科普馆"], cameraId: "CAM-S03", recordedAt: new Date("2026-06-15T13:00:00"), visitorCount: 356, congestionLevel: "HIGH", avgStayMinutes: 22.8 },
      { scenicAreaId: scenicArea.id, stopId: stop2Map["观鸟平台"], cameraId: "CAM-S04", recordedAt: new Date("2026-06-15T15:00:00"), visitorCount: 28, congestionLevel: "LOW", avgStayMinutes: 8.5 },
    ],
  })
  console.log("Created camera statistics")

  const perf1 = await prisma.performance.create({
    data: {
      scenicAreaId: scenicArea.id,
      stopId: stopMap["渔家文化广场"],
      title: "青山湖水上实景演出",
      scheduledTime: new Date("2026-06-15T19:30:00"),
      duration: 90,
      totalSeats: 500,
      soldSeats: 423,
      status: "COMPLETED",
    },
  })

  const perf2 = await prisma.performance.create({
    data: {
      scenicAreaId: scenicArea.id,
      stopId: stopMap["渔家文化广场"],
      title: "渔家风情民俗表演",
      scheduledTime: new Date("2026-06-15T14:00:00"),
      duration: 60,
      totalSeats: 400,
      soldSeats: 326,
      status: "CANCELLED",
      cancelReason: "设备故障，舞台灯光系统异常，无法正常演出",
    },
  })

  const perf3 = await prisma.performance.create({
    data: {
      scenicAreaId: scenicArea.id,
      stopId: stop2Map["湿地科普馆"],
      title: "湿地生态科普剧场",
      scheduledTime: new Date("2026-06-17T10:00:00"),
      duration: 45,
      totalSeats: 200,
      soldSeats: 87,
      status: "SCHEDULED",
    },
  })
  console.log("Created performances")

  await prisma.thresholdConfig.createMany({
    data: [
      { scenicAreaId: scenicArea.id, metricType: "CONGESTION", metricName: "站点拥堵指数", warnValue: 300, criticalValue: 600, unit: "人", updatedBy: "运营主管" },
      { scenicAreaId: scenicArea.id, metricType: "SALES", metricName: "二消转化率", warnValue: 15, criticalValue: 10, unit: "%", updatedBy: "运营主管" },
      { scenicAreaId: scenicArea.id, metricType: "CANCELLATION", metricName: "演出取消率", warnValue: 5, criticalValue: 15, unit: "%", updatedBy: "运营主管" },
      { scenicAreaId: scenicArea.id, metricType: "STAY_DURATION", metricName: "平均停留时长", warnValue: 90, criticalValue: 45, unit: "分钟", updatedBy: "运营主管" },
    ],
  })
  console.log("Created threshold configs")

  const riskAlert = await prisma.riskAlert.create({
    data: {
      scenicAreaId: scenicArea.id,
      routeId: route1.id,
      alertType: "CANCELLATION",
      severity: "CRITICAL",
      title: "渔家风情民俗表演取消 — 二消链路断裂风险",
      description: "渔家风情民俗表演因设备故障取消，已售326张票。演出取消导致周边渔家风味餐厅客流量骤降，青山文创店及竹筏漂流体验中心受连带影响，预计二消损失约35%-42%。",
      isResolved: false,
      detectedAt: new Date("2026-06-15T14:05:00"),
    },
  })
  console.log("Created risk alert")

  await prisma.reviewMaterial.create({
    data: {
      scenicAreaId: scenicArea.id,
      alertId: riskAlert.id,
      performanceId: perf2.id,
      title: "渔家风情民俗表演取消复盘报告",
      content: "2026年6月15日14:00，渔家风情民俗表演因舞台灯光系统故障取消。该演出为环湖经典路线核心二消项目，取消后对周边商户产生级联影响。",
      secondaryConsumptionRate: 23.5,
      visitorImpact: "326名已购票游客受影响，其中28%选择提前离园，周边景点15:00后客流下降42%",
      revenueImpact: "渔家风味餐厅当日营业额下降38%，青山文创店下降35%，竹筏漂流体验中心午后退订率58%，关联商户总损失约￥4,280",
      recommendations: "1. 立即推送周边替代活动及餐饮优惠券；2. 增设备用演出方案或移动舞台；3. 建立演出取消5分钟应急响应流程；4. 对受影响游客发放下次免费观演券",
      generatedAt: new Date("2026-06-15T16:00:00"),
    },
  })
  console.log("Created review material")

  console.log("Seeding completed.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
