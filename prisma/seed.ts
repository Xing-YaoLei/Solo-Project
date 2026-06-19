import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

const vehicleModels = [
  "宝马 530Li",
  "奔驰 E300L",
  "奥迪 A6L",
  "丰田 凯美瑞",
  "本田 雅阁",
  "大众 迈腾",
  "别克 君越",
  "日产 天籁",
  "马自达 阿特兹",
  "福特 蒙迪欧",
];

const owners = [
  "张伟",
  "李娜",
  "王强",
  "刘洋",
  "陈静",
  "杨帆",
  "赵敏",
  "黄磊",
  "周杰",
  "吴芳",
];

const stations = [
  { name: "机修工位 1", type: "mechanical" },
  { name: "机修工位 2", type: "mechanical" },
  { name: "钣金工位 1", type: "body" },
  { name: "喷漆工位 1", type: "paint" },
  { name: "电工工位 1", type: "electrical" },
];

const technicians = [
  { name: "张师傅", role: "technician" },
  { name: "李师傅", role: "technician" },
  { name: "王师傅", role: "technician" },
  { name: "赵师傅", role: "technician" },
  { name: "刘师傅", role: "technician" },
];

const inspectionTypes = [
  "外观检查",
  "发动机检查",
  "刹车系统检查",
  "底盘检查",
  "电器系统检查",
  "轮胎检查",
];

const diagnosisItems = [
  { name: "发动机异响", severity: "high", isAbnormal: true },
  { name: "刹车偏软", severity: "high", isAbnormal: true },
  { name: "机油液位低", severity: "medium", isAbnormal: true },
  { name: "刹车片磨损", severity: "medium", isAbnormal: true },
  { name: "轮胎花纹浅", severity: "low", isAbnormal: true },
  { name: "空调不制冷", severity: "low", isAbnormal: true },
  { name: "灯光正常", severity: "low", isAbnormal: false },
  { name: "电瓶正常", severity: "low", isAbnormal: false },
];

const parts = [
  { name: "机油滤清器", code: "OF-001", price: 89 },
  { name: "空气滤清器", code: "AF-002", price: 128 },
  { name: "刹车片前", code: "BPF-003", price: 580 },
  { name: "刹车片后", code: "BPR-004", price: 480 },
  { name: "机油 5W-30", code: "OIL-005", price: 398 },
  { name: "变速箱油", code: "TF-006", price: 280 },
  { name: "火花塞", code: "SP-007", price: 156 },
  { name: "空调滤芯", code: "ACF-008", price: 95 },
];

const insuranceCompanies = [
  "中国平安",
  "中国人保",
  "太平洋保险",
  "中国人寿",
  "阳光保险",
];

function randomDate(daysBack: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  date.setHours(9 + Math.floor(Math.random() * 8));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

function randomPlate(): string {
  const provinces = ["京", "沪", "粤", "浙", "苏", "川", "鲁", "豫"];
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const province = provinces[Math.floor(Math.random() * provinces.length)];
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const numbers = Math.floor(Math.random() * 90000 + 10000).toString();
  return `${province}${letter}${numbers}`;
}

async function seed() {
  console.log("开始种子数据生成...");

  await prisma.partUsage.deleteMany();
  await prisma.diagnosisResult.deleteMany();
  await prisma.inspectionPhoto.deleteMany();
  await prisma.insuranceDoc.deleteMany();
  await prisma.workOrderItem.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.technician.deleteMany();
  await prisma.workStation.deleteMany();
  await prisma.shareLink.deleteMany();

  console.log("清理旧数据完成");

  for (const station of stations) {
    await prisma.workStation.create({ data: station });
  }
  console.log("工位数据创建完成");

  for (const tech of technicians) {
    await prisma.technician.create({ data: tech });
  }
  console.log("技师数据创建完成");

  const dbStations = await prisma.workStation.findMany();
  const dbTechnicians = await prisma.technician.findMany();

  for (let i = 0; i < 20; i++) {
    const createdDate = randomDate(60);
    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber: randomPlate(),
        model: vehicleModels[Math.floor(Math.random() * vehicleModels.length)],
        ownerName: owners[Math.floor(Math.random() * owners.length)],
        ownerPhone: `1${Math.floor(Math.random() * 9 + 3)}${Math.floor(Math.random() * 900000000 + 100000000)}`,
        vin: `LVV${Math.floor(Math.random() * 900000000000 + 100000000000)}`,
        mileage: Math.floor(Math.random() * 80000 + 10000),
        color: ["黑", "白", "银", "灰", "红", "蓝"][Math.floor(Math.random() * 6)],
        createdAt: createdDate,
      },
    });

    const orderCount = Math.floor(Math.random() * 4 + 1);
    for (let j = 0; j < orderCount; j++) {
      const orderDate = new Date(createdDate);
      orderDate.setDate(orderDate.getDate() + j * Math.floor(Math.random() * 15 + 7));
      if (orderDate > new Date()) continue;

      const isRework = Math.random() < 0.15;
      const totalAmount = new Decimal(Math.floor(Math.random() * 5000 + 500));
      const station = dbStations[Math.floor(Math.random() * dbStations.length)];
      const technician = dbTechnicians[Math.floor(Math.random() * dbTechnicians.length)];

      const startedAt = new Date(orderDate);
      startedAt.setHours(9 + Math.floor(Math.random() * 4));
      const completedAt = new Date(startedAt);
      completedAt.setHours(startedAt.getHours() + Math.floor(Math.random() * 4 + 1));

      const order = await prisma.workOrder.create({
        data: {
          orderNumber: `WO${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, "0")}${String(Math.floor(Math.random() * 90000 + 10000))}`,
          vehicleId: vehicle.id,
          stationId: station.id,
          technicianId: technician.id,
          status: "completed",
          totalAmount,
          isRework,
          diagnosisResult: isRework ? "返修工单，故障未彻底解决" : "正常维修完成",
          createdAt: orderDate,
          startedAt,
          completedAt,
        },
      });

      const itemCount = Math.floor(Math.random() * 3 + 2);
      for (let k = 0; k < itemCount; k++) {
        const itemNames = ["常规保养", "刹车检修", "发动机检修", "电路检测", "空调维修"];
        const itemName = itemNames[Math.floor(Math.random() * itemNames.length)];
        const price = new Decimal(Math.floor(Math.random() * 800 + 200));
        await prisma.workOrderItem.create({
          data: {
            orderId: order.id,
            itemName,
            itemType: k === 0 ? "service" : "labor",
            price,
            quantity: 1,
            subtotal: price,
            sortOrder: k,
          },
        });
      }

      const inspectionCount = Math.floor(Math.random() * 4 + 3);
      for (let k = 0; k < inspectionCount; k++) {
        const insType = inspectionTypes[k % inspectionTypes.length];
        const isPassed = Math.random() > 0.15;
        await prisma.inspectionPhoto.create({
          data: {
            orderId: order.id,
            photoUrl: `/images/inspection/${order.id}-${k}.jpg`,
            inspectionType: insType,
            isPassed,
            remark: isPassed ? "检查合格" : `${insType}存在问题，需要维修`,
            createdAt: new Date(startedAt.getTime() + k * 30 * 60 * 1000),
          },
        });
      }

      const diagCount = Math.floor(Math.random() * 3 + 2);
      for (let k = 0; k < diagCount; k++) {
        const diag = diagnosisItems[Math.floor(Math.random() * diagnosisItems.length)];
        await prisma.diagnosisResult.create({
          data: {
            orderId: order.id,
            itemName: diag.name,
            result: diag.isAbnormal ? "异常" : "正常",
            severity: diag.severity,
            isAbnormal: diag.isAbnormal,
            sortOrder: k,
          },
        });
      }

      const partCount = Math.floor(Math.random() * 3 + 1);
      const usedParts = new Set<number>();
      for (let k = 0; k < partCount; k++) {
        const partIndex = Math.floor(Math.random() * parts.length);
        if (usedParts.has(partIndex)) continue;
        usedParts.add(partIndex);
        const part = parts[partIndex];
        const quantity = Math.floor(Math.random() * 4 + 1);
        const unitPrice = new Decimal(part.price);
        const subtotal = unitPrice.mul(quantity);
        await prisma.partUsage.create({
          data: {
            orderId: order.id,
            partId: `PART-${part.code}`,
            partName: part.name,
            partCode: part.code,
            quantity,
            unitPrice,
            subtotal,
            usedAt: startedAt,
          },
        });
      }

      if (Math.random() < 0.3) {
        await prisma.insuranceDoc.create({
          data: {
            orderId: order.id,
            company: insuranceCompanies[Math.floor(Math.random() * insuranceCompanies.length)],
            policyNumber: `POL${Math.floor(Math.random() * 9000000 + 1000000)}`,
            claimAmount: totalAmount.mul(Math.random() * 0.5 + 0.5),
            claimStatus: ["pending", "approved", "settled"][Math.floor(Math.random() * 3)],
            filedAt: new Date(completedAt.getTime() + 24 * 60 * 60 * 1000),
            settledAt: new Date(completedAt.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }
  }

  console.log("车辆和工单数据创建完成");
  console.log("种子数据生成完成!");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
