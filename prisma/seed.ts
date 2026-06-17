import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const apartmentIds = ["APT-001", "APT-002", "APT-003", "APT-004", "APT-005"];
const repairTypes = ["水电维修", "家具维修", "家电维修", "门锁维修", "管道疏通"];
const driverNames = ["张伟", "李强", "王磊", "刘洋", "陈明"];
const vehicleNos = ["沪A12345", "沪B67890", "沪C11111", "沪D22222", "沪E33333"];
const materialNames = ["水龙头", "灯泡", "门锁芯", "PVC管道", "开关面板", "马桶配件"];
const operators = ["系统自动", "运营-李娜", "财务-王芳", "运营-赵强"];
const changeReasons = ["用户退款", "优惠调整", "费用补录", "差额修正", "账单核对"];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("开始清空数据...");
  await prisma.loadingItem.deleteMany();
  await prisma.trackPoint.deleteMany();
  await prisma.driverCheckin.deleteMany();
  await prisma.dispatchOrder.deleteMany();
  await prisma.crmRecord.deleteMany();
  await prisma.paymentRecord.deleteMany();
  await prisma.meterReading.deleteMany();
  await prisma.routePlan.deleteMany();
  await prisma.driver.deleteMany();

  console.log("开始创建司机...");
  const drivers = await Promise.all(
    driverNames.map((name, i) =>
      prisma.driver.create({
        data: {
          name,
          phone: `138${String(randInt(10000000, 99999999))}`,
          vehicleNo: vehicleNos[i],
        },
      })
    )
  );

  console.log("开始创建路线...");
  const today = new Date();
  const routes = [];
  for (let i = 0; i < 12; i++) {
    const driver = drivers[i % drivers.length];
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

    const statusOptions = ["pending", "in_progress", "completed", "delayed"];
    const route = await prisma.routePlan.create({
      data: {
        routeName: `路线${String.fromCharCode(65 + i)}-${today.getMonth() + 1}${today.getDate()}`,
        driverId: driver.id,
        plannedStart,
        plannedEnd,
        actualStart,
        actualEnd,
        plannedOrders: randInt(5, 12),
        completedOrders: randInt(3, 10),
        status: isDelayed ? "delayed" : pick(statusOptions),
      },
    });
    routes.push(route);
  }

  console.log("开始创建派单、CRM记录、支付流水、抄表记录...");
  for (let i = 0; i < 60; i++) {
    const route = routes[i % routes.length];
    const plannedTime = new Date(today);
    plannedTime.setHours(randInt(8, 18), randInt(0, 59), 0, 0);
    const isOnTime = Math.random() > 0.3;
    const actualTime = new Date(plannedTime);
    actualTime.setMinutes(actualTime.getMinutes() + (isOnTime ? randInt(-15, 15) : randInt(30, 120)));

    const order = await prisma.dispatchOrder.create({
      data: {
        orderNo: `WO${Date.now().toString().slice(-6)}${String(i).padStart(3, "0")}`,
        apartmentId: pick(apartmentIds),
        repairType: pick(repairTypes),
        status: isOnTime ? "已完成" : "延误完成",
        plannedTime,
        actualTime,
        routeId: route.id,
        amount: randFloat(100, 800),
        isOnTime,
      },
    });

    await prisma.crmRecord.create({
      data: {
        orderId: order.id,
        source: pick(["CRM系统", "小程序", "客服电话"]),
        data: {
          customerName: `用户${i + 1}`,
          customerPhone: `139${String(randInt(10000000, 99999999))}`,
          remark: pick(["紧急处理", "工作日上门", "周末上门"]),
        },
        dataVersion: `v${randInt(1, 3)}.0`,
      },
    });

    const baseAmount = randFloat(150, 600);
    const versionCount = randInt(1, 3);
    for (let v = 1; v <= versionCount; v++) {
      await prisma.paymentRecord.create({
        data: {
          orderId: order.id,
          version: v,
          amount: parseFloat((baseAmount + randFloat(-50, 50) * (v - 1)).toFixed(2)),
          status: v === versionCount ? "已确认" : "已变更",
          operator: pick(operators),
          changeReason: pick(changeReasons),
          changedAt: new Date(Date.now() - (versionCount - v) * 3600000),
        },
      });
    }

    await prisma.meterReading.create({
      data: {
        orderId: order.id,
        meterType: pick(["电表", "水表", "燃气表"]),
        readingValue: randFloat(100, 5000),
        rawData: {
          meterNo: `M${String(randInt(100000, 999999))}`,
          readingPhoto: `/photos/meter/${i}.jpg`,
        },
      },
    });

    const loadingCount = randInt(1, 3);
    for (let l = 0; l < loadingCount; l++) {
      const quantity = randInt(1, 10);
      const isAbnormal = Math.random() > 0.75;
      await prisma.loadingItem.create({
        data: {
          routeId: route.id,
          orderId: order.id,
          materialName: pick(materialNames),
          quantity,
          unit: pick(["个", "套", "米"]),
          loadedQuantity: isAbnormal ? randInt(0, quantity - 1) : quantity,
          status: isAbnormal ? (Math.random() > 0.5 ? "abnormal" : "missing") : "normal",
          originalRecordId: `REC-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}-${String(i * 10 + l).padStart(5, "0")}`,
          remark: isAbnormal ? pick(["仓库库存不足", "物料损坏更换", "用户临时增加"]) : null,
        },
      });
    }

    await prisma.driverCheckin.create({
      data: {
        driverId: route.driverId,
        routeId: route.id,
        checkinTime: new Date(plannedTime.getTime() - randInt(30, 60) * 60000),
        latitude: randFloat(31.1, 31.3, 6),
        longitude: randFloat(121.3, 121.6, 6),
        status: pick(["checked_in", "checked_in", "checked_in", "abnormal"]),
      },
    });

    for (let t = 0; t < 8; t++) {
      await prisma.trackPoint.create({
        data: {
          routeId: route.id,
          timestamp: new Date(plannedTime.getTime() + t * 30 * 60000),
          latitude: randFloat(31.1, 31.3, 6),
          longitude: randFloat(121.3, 121.6, 6),
          speed: randFloat(0, 60),
          orderId: t % 4 === 0 ? order.id : null,
        },
      });
    }
  }

  console.log("种子数据创建完成！");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
