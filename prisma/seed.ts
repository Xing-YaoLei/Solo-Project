import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("123456", 10);

  const stores = await prisma.store.createMany({
    data: [
      { name: "总部旗舰店", code: "STORE001" },
      { name: "朝阳路分店", code: "STORE002" },
      { name: "新华路分店", code: "STORE003" },
    ],
  });

  const storeList = await prisma.store.findMany();

  const users = await prisma.user.createMany({
    data: [
      {
        email: "admin@pharmacy.com",
        name: "系统管理员",
        password: hashedPassword,
        role: "admin",
        storeId: storeList[0].id,
      },
      {
        email: "manager@pharmacy.com",
        name: "张经理",
        password: hashedPassword,
        role: "manager",
        storeId: storeList[0].id,
      },
      {
        email: "pharmacist1@pharmacy.com",
        name: "李药师",
        password: hashedPassword,
        role: "staff",
        storeId: storeList[0].id,
      },
      {
        email: "pharmacist2@pharmacy.com",
        name: "王药师",
        password: hashedPassword,
        role: "staff",
        storeId: storeList[1].id,
      },
    ],
  });

  const userList = await prisma.user.findMany();

  const chronicTypes = [
    ["高血压", "高血脂"],
    ["糖尿病"],
    ["高血压"],
    ["冠心病"],
    ["糖尿病", "高血压"],
  ];

  const memberNames = [
    "赵建国", "钱秀兰", "孙德明", "李桂英", "周荣华",
    "吴美玲", "郑天翔", "王淑芬", "冯志强", "陈春燕",
    "褚海涛", "卫丽华", "蒋明辉", "沈玉梅", "韩晓东",
  ];

  const membersData: Prisma.MemberCreateManyInput[] = memberNames.map(
    (name, i) => ({
      name,
      phone: `138${String(10000000 + i * 137).slice(0, 8)}`,
      storeId: storeList[i % storeList.length].id,
      riskLevel:
        i % 5 === 0 ? "high" : i % 3 === 0 ? "medium" : "low",
      age: 55 + (i % 25),
      gender: i % 2 === 0 ? "男" : "女",
      chronicTypes: chronicTypes[i % chronicTypes.length],
      registeredAt: new Date(2024, i % 12, 1 + (i % 20)),
    })
  );

  await prisma.member.createMany({ data: membersData });
  const memberList = await prisma.member.findMany();

  const drugNames = [
    { name: "苯磺酸氨氯地平片", sku: "DRUG001", category: "心血管" },
    { name: "盐酸二甲双胍缓释片", sku: "DRUG002", category: "降糖" },
    { name: "阿托伐他汀钙片", sku: "DRUG003", category: "降脂" },
    { name: "阿司匹林肠溶片", sku: "DRUG004", category: "心血管" },
    { name: "格列美脲片", sku: "DRUG005", category: "降糖" },
    { name: "硝苯地平控释片", sku: "DRUG006", category: "心血管" },
    { name: "辛伐他汀片", sku: "DRUG007", category: "降脂" },
    { name: "缬沙坦胶囊", sku: "DRUG008", category: "心血管" },
    { name: "盐酸贝那普利片", sku: "DRUG009", category: "心血管" },
    { name: "阿卡波糖片", sku: "DRUG010", category: "降糖" },
  ];

  await prisma.drug.createMany({ data: drugNames });
  const drugList = await prisma.drug.findMany();

  for (const drug of drugList) {
    await prisma.inventoryBatch.createMany({
      data: [
        {
          drugId: drug.id,
          batchNo: `B${2024}${String(drug.sku).slice(-3)}01`,
          expiryDate: new Date(2025, 11, 30),
          quantity: 500,
          storeId: storeList[0].id,
        },
        {
          drugId: drug.id,
          batchNo: `B${2024}${String(drug.sku).slice(-3)}02`,
          expiryDate: new Date(2025, 5, 15),
          quantity: 120,
          storeId: storeList[0].id,
        },
        {
          drugId: drug.id,
          batchNo: `B${2024}${String(drug.sku).slice(-3)}03`,
          expiryDate: new Date(2025, 0, 20),
          quantity: 45,
          storeId: storeList[1].id,
        },
        {
          drugId: drug.id,
          batchNo: `B${2024}${String(drug.sku).slice(-3)}04`,
          expiryDate: new Date(2025, 2, 28),
          quantity: 80,
          storeId: storeList[2].id,
        },
      ],
    });
  }

  for (let i = 0; i < 20; i++) {
    const drug = drugList[i % drugList.length];
    await prisma.replenishmentOrder.create({
      data: {
        drugId: drug.id,
        quantity: 100 + (i % 5) * 50,
        orderDate: new Date(2025, 5 - (i % 6), 1 + (i % 20)),
        storeId: storeList[i % storeList.length].id,
      },
    });
  }

  const staffList = userList.filter((u) => u.role === "staff");
  for (let i = 0; i < memberList.length; i++) {
    const member = memberList[i];
    await prisma.followUp.create({
      data: {
        memberId: member.id,
        assigneeId: staffList[i % staffList.length].id,
        status: i % 4 === 0 ? "completed" : i % 4 === 1 ? "pending" : "annotated",
        scheduledDate: new Date(2025, 5, 1 + (i % 25)),
        completedDate: i % 4 === 0 ? new Date(2025, 5, 2 + (i % 25)) : null,
        notes:
          i % 4 === 0
            ? "血压控制良好，继续按原方案服药"
            : null,
      },
    });
  }

  for (let i = 0; i < memberList.length; i++) {
    const member = memberList[i];
    for (let j = 0; j < 3; j++) {
      const drug = drugList[(i + j) % drugList.length];
      await prisma.medicationRecord.create({
        data: {
          memberId: member.id,
          drugName: drug.name,
          drugSku: drug.sku,
          quantity: 2 + (j % 3),
          unitPrice: new Prisma.Decimal(20 + (i % 10) * 5.5),
          purchaseDate: new Date(2025, 5 - j, 1 + (i % 20)),
          storeId: member.storeId,
        },
      });
    }
  }

  for (let i = 0; i < memberList.length; i++) {
    const member = memberList[i];
    const drug = drugList[i % drugList.length];
    await prisma.prescription.create({
      data: {
        memberId: member.id,
        drugName: drug.name,
        dosage: "5mg",
        frequency: "每日一次",
        issueDate: new Date(2025, 4, 1 + (i % 25)),
        doctorName: i % 3 === 0 ? "刘医生" : "陈医生",
        isClear: i % 5 !== 0,
      },
    });
  }

  for (let i = 0; i < 18; i++) {
    const member = memberList[i % memberList.length];
    await prisma.insuranceTransaction.create({
      data: {
        memberId: member.id,
        amount: new Prisma.Decimal(120 + (i % 20) * 25.5),
        count: 1 + (i % 3),
        transactionDate: new Date(2025, i % 6, 1 + (i % 20)),
        storeId: member.storeId,
      },
    });
  }

  const adminId = userList.find((u) => u.role === "admin")?.id || "";
  for (let i = 0; i < 5; i++) {
    await prisma.importBatch.create({
      data: {
        source: ["pos", "member", "inventory", "insurance"][i % 4] as any,
        status: i % 3 === 0 ? "completed" : i % 3 === 1 ? "processing" : "failed",
        totalRecords: 100 + i * 25,
        successCount: 95 + i * 20,
        errorCount: i * 2,
        fileName: `import_${["pos", "member", "inventory", "insurance"][i % 4]}_20250${i + 1}.csv`,
        importedBy: adminId,
        importedAt: new Date(2025, i, 15),
      },
    });
  }

  const batchList = await prisma.importBatch.findMany();
  for (const batch of batchList) {
    for (let i = 0; i < 5; i++) {
      await prisma.importRecord.create({
        data: {
          batchId: batch.id,
          rawData: { row: i, data: `sample_record_${i}` } as any,
          status: i % 3 === 0 ? "error" : "success",
          errorMsg: i % 3 === 0 ? "字段映射失败" : null,
        },
      });
    }
  }

  console.log("Seed data created successfully!");
  console.log("默认账号:");
  console.log("  管理员: admin@pharmacy.com / 123456");
  console.log("  管理层: manager@pharmacy.com / 123456");
  console.log("  一线: pharmacist1@pharmacy.com / 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
