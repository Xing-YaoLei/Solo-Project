import { PrismaClient, Prisma, UserRole, BatchType, BatchStatus, OrderStatus, TransactionStatus } from '@prisma/client';

const prisma = new PrismaClient();

const toDateTime = (date: Date, hour: number, minute = 0) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0, 0);

async function main() {
  console.log('🌱 开始初始化种子数据...\n');

  // ========== Step 1: 用户 ==========
  const users = [
    { email: 'manager@beauty.com', name: '张店长', role: UserRole.MANAGER },
    { email: 'tech1@beauty.com', name: '李美容师', role: UserRole.TECHNICIAN },
    { email: 'tech2@beauty.com', name: '王美容师', role: UserRole.TECHNICIAN },
    { email: 'tech3@beauty.com', name: '陈美容师', role: UserRole.TECHNICIAN },
  ];
  const userMap: Record<string, string> = {};
  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      userMap[u.email] = existing.id;
      console.log(`⚠️  用户已存在: ${u.email} (${u.name})`);
    } else {
      const created = await prisma.user.create({ data: u });
      userMap[u.email] = created.id;
      console.log(`✅ 创建用户: ${u.email} (${u.name})`);
    }
  }
  const managerId = userMap['manager@beauty.com'];
  const techIds = [userMap['tech1@beauty.com'], userMap['tech2@beauty.com'], userMap['tech3@beauty.com']];

  const existingBatch = await prisma.importBatch.findFirst({ where: { batchNo: { startsWith: 'I-SEED' } } });
  if (existingBatch) {
    console.log('\n⚠️  已存在种子批次数据，跳过演示数据创建。\n');
    console.log('🎯 默认演示账号（密码均为 123456）:');
    console.log('   - 管理层: manager@beauty.com');
    console.log('   - 技师1 : tech1@beauty.com');
    console.log('   - 技师2 : tech2@beauty.com');
    console.log('   - 技师3 : tech3@beauty.com');
    console.log('\n💡 如要重置种子数据，可先手动清空数据库再运行 seed。');
    return;
  }

  // ========== Step 2: 批次 ==========
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 3);

  const inventoryBatch = await prisma.importBatch.create({
    data: {
      batchNo: `I-SEED-${Date.now()}-INV`,
      type: BatchType.INVENTORY,
      fileName: 'seed_inventory.csv',
      recordCount: 8,
      importedBy: managerId,
      importedAt: toDateTime(baseDate, 10, 0),
      status: BatchStatus.COMPLETED,
    },
  });

  const transactionBatch = await prisma.importBatch.create({
    data: {
      batchNo: `T-SEED-${Date.now()}-TRX`,
      type: BatchType.TRANSACTION,
      fileName: 'seed_transactions.csv',
      recordCount: 20,
      importedBy: managerId,
      importedAt: toDateTime(baseDate, 14, 0),
      status: BatchStatus.COMPLETED,
    },
  });

  const reviewBatch = await prisma.importBatch.create({
    data: {
      batchNo: `R-SEED-${Date.now()}-REV`,
      type: BatchType.REVIEW,
      fileName: 'seed_reviews.csv',
      recordCount: 16,
      importedBy: managerId,
      importedAt: toDateTime(baseDate, 18, 0),
      status: BatchStatus.COMPLETED,
    },
  });
  console.log('✅ 创建 3 个导入批次（库存/收银/点评）');

  // ========== Step 3: 库存 ==========
  const inventorySeeds = [
    { skuCode: 'SKU001', productName: '玻尿酸精华液', category: '护肤精华', unit: '瓶', stockQuantity: 100, unitPrice: 298 },
    { skuCode: 'SKU002', productName: '烟酰胺原液', category: '护肤精华', unit: '瓶', stockQuantity: 80, unitPrice: 198 },
    { skuCode: 'SKU003', productName: '补水保湿面膜', category: '面膜', unit: '片', stockQuantity: 500, unitPrice: 38 },
    { skuCode: 'SKU004', productName: '胶原蛋白面霜', category: '面霜', unit: '瓶', stockQuantity: 60, unitPrice: 458 },
    { skuCode: 'SKU005', productName: '清洁洁面乳', category: '洁面', unit: '支', stockQuantity: 120, unitPrice: 128 },
    { skuCode: 'SKU006', productName: '抗皱眼霜', category: '眼部护理', unit: '瓶', stockQuantity: 45, unitPrice: 598 },
    { skuCode: 'SKU007', productName: '舒缓爽肤水', category: '化妆水', unit: '瓶', stockQuantity: 90, unitPrice: 188 },
    { skuCode: 'SKU008', productName: '防晒隔离霜', category: '防晒', unit: '瓶', stockQuantity: 70, unitPrice: 268 },
  ];
  const inventories: { id: string; productName: string; category: string; unitPrice: number }[] = [];
  for (let i = 0; i < inventorySeeds.length; i++) {
    const s = inventorySeeds[i];
    const inv = await prisma.inventory.create({
      data: {
        batchId: inventoryBatch.id,
        skuCode: s.skuCode,
        productName: s.productName,
        category: s.category,
        unit: s.unit,
        stockQuantity: new Prisma.Decimal(s.stockQuantity),
        unitPrice: new Prisma.Decimal(s.unitPrice),
      },
    });
    inventories.push({ id: inv.id, productName: inv.productName, category: s.category, unitPrice: s.unitPrice });
  }
  console.log(`✅ 创建 ${inventories.length} 条库存记录`);

  // ========== Step 4: 手牌 + 收银流水 + 点评 ==========
  const customers = ['王女士', '李女士', '张女士', '刘女士', '陈女士', '杨女士', '赵女士', '黄女士', '周女士', '吴女士'];
  const serviceItems = ['深层补水护理', '抗衰紧致护理', '美白亮肤护理', '清洁祛痘护理', '眼部护理', '颈部护理', '面部按摩', 'SPA水疗'];
  const amounts = [398, 598, 798, 1280, 1680, 2180, 880, 1080];
  const payments = ['微信', '支付宝', '银行卡', '储值卡'];
  const scripts = ['V1-关心回访', 'V2-效果询问', 'V3-满意度调查'];

  const HAND_COUNT = 20;
  const REVIEW_COUNT = 16;
  const handNos: string[] = [];
  for (let i = 0; i < HAND_COUNT; i++) handNos.push(`H20240601${String(i + 1).padStart(3, '0')}`);

  const orderStatuses: Array<'CREATED' | 'IN_SERVICE' | 'COMPLETED' | 'PAID' | 'REVIEWED'> = [
    'REVIEWED', 'PAID', 'REVIEWED', 'PAID', 'REVIEWED',
    'COMPLETED', 'REVIEWED', 'PAID', 'REVIEWED', 'COMPLETED',
    'REVIEWED', 'PAID', 'REVIEWED', 'COMPLETED', 'REVIEWED',
    'PAID', 'COMPLETED', 'IN_SERVICE', 'CREATED', 'CREATED',
  ];

  for (let i = 0; i < HAND_COUNT; i++) {
    const handNo = handNos[i];
    const techId = techIds[i % 3];
    const orderNo = `ORD202406010${String(i + 1).padStart(2, '0')}`;
    const serviceItem = serviceItems[i % 8];
    const amount = amounts[i % 8];
    const hour = 10 + (i % 10);
    const minute = (i * 7) % 60;
    const transTime = toDateTime(baseDate, hour, minute);
    const status = orderStatuses[i];
    const needPaid = ['COMPLETED', 'PAID', 'REVIEWED'].includes(status);
    const needReview = status === 'REVIEWED' && i < REVIEW_COUNT;

    const order = await prisma.handOrder.create({
      data: {
        handNo,
        technicianId: techId,
        customerName: customers[i % 10],
        serviceItems: [serviceItem],
        totalAmount: new Prisma.Decimal(amount),
        status: status as any,
        createdAt: toDateTime(baseDate, hour - 1, minute),
        completedAt: needPaid ? toDateTime(baseDate, hour + 1, minute) : undefined,
      },
    });

    if (needPaid) {
      await prisma.transaction.create({
        data: {
          batchId: transactionBatch.id,
          orderNo,
          handNo,
          technicianId: techId,
          serviceItem,
          amount: new Prisma.Decimal(amount),
          paymentMethod: payments[i % 4],
          transactionTime: transTime,
          status: TransactionStatus.PAID,
        },
      });
    }

    // 库存领用：每手单随机关联 2 种库存
    const invIdx1 = i % inventories.length;
    const invIdx2 = (i + 2) % inventories.length;
    const quantities = [1, 1, 2, 1, 1, 3, 1, 1];
    const invUsage1 = await prisma.inventoryUsage.create({
      data: {
        orderId: order.id,
        inventoryId: inventories[invIdx1].id,
        quantity: new Prisma.Decimal(quantities[i % 8]),
        isAbnormal: i % 7 === 0,
        abnormalNote: i % 7 === 0 ? '产品临近保质期' : null,
      },
    });
    const invUsage2 = await prisma.inventoryUsage.create({
      data: {
        orderId: order.id,
        inventoryId: inventories[invIdx2].id,
        quantity: new Prisma.Decimal(1),
        isAbnormal: false,
      },
    });

    if (needReview) {
      const ratings = [5, 5, 4, 5, 3, 5, 4, 5, 5, 4, 5, 5, 4, 3, 5, 4];
      const contents = ['服务非常专业，效果很好！', '技师手法娴熟，环境舒适', '整体满意，会再来', '效果超出预期', '还可以，希望下次更好', '强烈推荐！', '很满意的一次体验', '产品很好用', '服务态度特别好', '做完皮肤水嫩嫩的', '效果明显', '性价比高', '值得信赖', '一般般吧', '非常好的服务', '下次还来'];
      const befores = [true, true, false, true, true, false, true, true, false, true, true, true, false, true, true, false];
      const afters = [true, true, true, false, true, true, true, false, true, true, true, false, true, true, false, true];
      const responded = [true, true, false, true, true, false, true, true, false, true, true, false, true, true, false, true];
      const j = i;
      await prisma.review.create({
        data: {
          batchId: reviewBatch.id,
          orderNo,
          rating: ratings[j],
          content: contents[j],
          hasBeforePhoto: befores[j],
          hasAfterPhoto: afters[j],
          followUpScript: scripts[j % scripts.length],
          responded: responded[j],
          reviewedAt: toDateTime(baseDate, 15 + (j % 5), (j * 11) % 60),
        },
      });
    }
  }
  console.log(`✅ 创建 ${HAND_COUNT} 个手牌（含 20 条收银流水 + ${REVIEW_COUNT} 条点评）`);

  console.log('\n🎉 种子数据初始化完成！');
  console.log('\n🎯 默认演示账号（密码均为 123456）:');
  console.log('   - 管理层: manager@beauty.com');
  console.log('   - 技师1 : tech1@beauty.com');
  console.log('   - 技师2 : tech2@beauty.com');
  console.log('   - 技师3 : tech3@beauty.com');
  console.log('\n📊 演示数据包含:');
  console.log('   - 3 个导入批次（有批次号、导入人、时间戳）');
  console.log('   - 8 条库存 + 关联库存领用记录');
  console.log('   - 20 个手牌（含各种状态，可用于漏斗图）');
  console.log('   - 20 条收银流水（用于消费分布、总览营收）');
  console.log('   - 16 条点评（含术前/术后照、回访话术，用于照片漏斗、回访趋势）');
  console.log('\n💡 访问 /import 可导入真实 CSV，新批次会立刻驱动 /dashboard 和 /analytics 指标刷新');
}

main()
  .catch(e => {
    console.error('❌ 种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
