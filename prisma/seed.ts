import { PrismaClient } from "@prisma/client";
import { addDays, subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("开始生成种子数据...");

  const stores = await prisma.store.createManyAndReturn({
    data: [
      { name: "咖啡工坊·总店", code: "ST001", address: "上海市静安区南京西路1号" },
      { name: "咖啡工坊·浦东店", code: "ST002", address: "上海市浦东新区陆家嘴环路100号" },
      { name: "咖啡工坊·徐汇店", code: "ST003", address: "上海市徐汇区衡山路50号" },
      { name: "咖啡工坊·虹桥店", code: "ST004", address: "上海市长宁区虹桥路200号" },
    ],
  });

  console.log(`已创建 ${stores.length} 家门店`);

  const staff = await prisma.staff.createManyAndReturn({
    data: [
      {
        email: "admin@coffee.com",
        name: "系统管理员",
        role: "manager",
        password: "admin123",
      },
      {
        email: "manager@coffee.com",
        name: "区域经理",
        role: "manager",
        password: "manager123",
      },
      {
        email: "store1@coffee.com",
        name: "张店长（总店）",
        role: "store_staff",
        storeId: stores[0].id,
        password: "store123",
      },
      {
        email: "store2@coffee.com",
        name: "李店长（浦东）",
        role: "store_staff",
        storeId: stores[1].id,
        password: "store123",
      },
    ],
  });

  console.log(`已创建 ${staff.length} 个员工账号`);

  const levels = ["普通", "银卡", "金卡", "钻石"];
  const membersData = [];

  for (let i = 1; i <= 120; i++) {
    const store = stores[i % stores.length];
    const level = levels[Math.min(Math.floor(i / 30), 3)];
    const totalStored = Math.floor(Math.random() * 5000) + 100;

    membersData.push({
      storeId: store.id,
      memberNo: `M${String(i).padStart(6, "0")}`,
      name: `会员${i}`,
      phone: `138${String(10000000 + i).slice(0, 8)}`,
      level,
      totalStored,
      createdAt: subDays(new Date(), Math.floor(Math.random() * 365)),
    });
  }

  const members = await prisma.member.createManyAndReturn({
    // @ts-ignore
    data: membersData,
  });

  console.log(`已创建 ${members.length} 个会员`);

  const accountsData = [];
  for (const member of members) {
    const balance = Math.floor(Math.random() * 2000);
    accountsData.push({
      memberId: member.id,
      balance,
      expireAt: addDays(new Date(), Math.floor(Math.random() * 365) - 30),
      isActive: balance > 0,
    });
  }
  // @ts-ignore
  await prisma.storedValueAccount.createMany({ data: accountsData });
  console.log("已创建储值账户");

  const flowTypes = ["deposit", "consume", "refund"];
  const flowsData = [];
  const allAccounts = await prisma.storedValueAccount.findMany();

  for (let i = 0; i < 500; i++) {
    const account = allAccounts[i % allAccounts.length];
    const type = flowTypes[Math.floor(Math.random() * flowTypes.length)];
    const amount = type === "consume" ? -Math.floor(Math.random() * 200) - 10 : Math.floor(Math.random() * 500) + 50;

    flowsData.push({
      accountId: account.id,
      type,
      amount,
      occurredAt: subDays(new Date(), Math.floor(Math.random() * 90)),
      source: Math.random() > 0.5 ? "pos" : "online",
    });
  }
  // @ts-ignore
  await prisma.accountFlow.createMany({ data: flowsData });
  console.log("已创建账户流水");

  const benefitTypes = ["coupon", "stored_value", "points"];
  const benefitNames = ["买一送一券", "免费升级券", "9折优惠券", "生日赠饮券", "100元储值金"];
  const benefitsData = [];

  for (let i = 0; i < 300; i++) {
    const member = members[i % members.length];
    const expireDays = Math.floor(Math.random() * 60) - 15;
    const status = expireDays < 0 ? "expired" : Math.random() > 0.3 ? "active" : "redeemed";

    benefitsData.push({
      memberId: member.id,
      type: benefitTypes[Math.floor(Math.random() * benefitTypes.length)],
      name: benefitNames[Math.floor(Math.random() * benefitNames.length)],
      value: Math.floor(Math.random() * 100) + 10,
      expireAt: addDays(new Date(), expireDays),
      status,
    });
  }
  // @ts-ignore
  await prisma.benefit.createMany({ data: benefitsData });
  console.log("已创建权益数据");

  const paymentMethods = ["stored_value", "wechat", "alipay", "cash"];
  const txTypes = ["deposit", "consume", "refund"];
  const transactionsData = [];

  for (let i = 0; i < 400; i++) {
    const member = members[i % members.length];
    const store = stores[i % stores.length];
    const type = txTypes[Math.floor(Math.random() * txTypes.length)];
    const amount = type === "refund" ? -(Math.floor(Math.random() * 100) + 10) : Math.floor(Math.random() * 500) + 20;

    transactionsData.push({
      memberId: member.id,
      storeId: store.id,
      type,
      amount,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      transactedAt: subDays(new Date(), Math.floor(Math.random() * 60)),
    });
  }
  // @ts-ignore
  await prisma.transaction.createMany({ data: transactionsData });
  console.log("已创建交易数据");

  const refundReasons = ["商品问题", "服务不满意", "重复下单", "会员退款", "其他"];
  const refundsData = [];
  const allTransactions = await prisma.transaction.findMany({ where: { type: "consume" } });

  for (let i = 0; i < 50; i++) {
    const tx = allTransactions[i % allTransactions.length];
    refundsData.push({
      memberId: tx.memberId!,
      transactionId: tx.id,
      reason: refundReasons[Math.floor(Math.random() * refundReasons.length)],
      amount: Math.floor(Math.random() * 80) + 20,
      refundedAt: subDays(new Date(), Math.floor(Math.random() * 30)),
    });
  }
  // @ts-ignore
  await prisma.refund.createMany({ data: refundsData });
  console.log("已创建退款数据");

  const products = ["美式咖啡", "拿铁", "卡布奇诺", "摩卡", "焦糖玛奇朵", "手冲单品", "冷萃咖啡", "燕麦拿铁"];
  const redemptionsData = [];

  for (let i = 0; i < 150; i++) {
    const member = members[i % members.length];
    const store = stores[i % stores.length];
    redemptionsData.push({
      memberId: member.id,
      storeId: store.id,
      redeemedAt: subDays(new Date(), Math.floor(Math.random() * 45)),
      value: Math.floor(Math.random() * 50) + 15,
      productName: products[Math.floor(Math.random() * products.length)],
    });
  }
  // @ts-ignore
  await prisma.redemption.createMany({ data: redemptionsData });
  console.log("已创建核销数据");

  const inventoryData = [];
  for (let i = 0; i < 80; i++) {
    const store = stores[i % stores.length];
    const pIdx = i % products.length;
    inventoryData.push({
      storeId: store.id,
      sku: `SKU${String(pIdx + 1).padStart(4, "0")}`,
      productName: products[pIdx],
      quantity: Math.floor(Math.random() * 500) + 50,
      costPrice: Math.floor(Math.random() * 15) + 5,
      batchId: "",
    });
  }

  const batch1 = await prisma.importBatch.create({
    data: {
      sourceType: "inventory",
      status: "completed",
      totalRecords: inventoryData.length,
      successCount: inventoryData.length,
      errorCount: 0,
      fileName: "inventory_20260601.csv",
      processedAt: new Date(),
    },
  });

  await prisma.inventory.createMany({
    // @ts-ignore
    data: inventoryData.map((d) => ({ ...d, batchId: batch1.id })),
  });

  await prisma.importBatch.createMany({
    data: [
      {
        storeId: stores[0].id,
        sourceType: "receipt",
        status: "completed",
        totalRecords: 120,
        successCount: 118,
        errorCount: 2,
        errorLog: "2条记录会员号匹配失败",
        fileName: "receipt_ST001_20260610.csv",
        processedAt: subDays(new Date(), 2),
      },
      {
        storeId: stores[1].id,
        sourceType: "pos",
        status: "completed",
        totalRecords: 200,
        successCount: 200,
        errorCount: 0,
        fileName: "pos_ST002_20260610.csv",
        processedAt: subDays(new Date(), 2),
      },
      {
        storeId: stores[2].id,
        sourceType: "receipt",
        status: "processing",
        totalRecords: 150,
        successCount: 50,
        errorCount: 0,
        fileName: "receipt_ST003_20260612.csv",
      },
    ],
  });
  console.log("已创建批次与库存数据");

  await prisma.memberNote.createMany({
    data: [
      {
        memberId: members[0].id,
        staffId: staff[2].id,
        content: "已电话通知储值即将过期，会员表示下周到店续费",
      },
      {
        memberId: members[5].id,
        staffId: staff[2].id,
        content: "会员生日月，赠送一杯免费饮品",
      },
      {
        memberId: members[10].id,
        staffId: staff[3].id,
        content: "权益已过期，推荐新储值活动套餐",
      },
    ],
  });
  console.log("已创建会员注释");

  console.log("✅ 种子数据生成完成！");
  console.log("\n测试账号：");
  console.log("  管理层:  admin@coffee.com / admin123");
  console.log("  管理层:  manager@coffee.com / manager123");
  console.log("  一线(总店): store1@coffee.com / store123");
  console.log("  一线(浦东): store2@coffee.com / store123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
