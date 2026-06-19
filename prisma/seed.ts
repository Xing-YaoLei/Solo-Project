import { PrismaClient, UserRole, WorkorderStatus, QuoteStatus, TransactionType, InsuranceStatus } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始播种种子数据...');

  // 1. 创建用户
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@autorepair.com' },
      update: {},
      create: {
        email: 'admin@autorepair.com',
        name: '张管理',
        role: UserRole.ADMIN,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      },
    }),
    prisma.user.upsert({
      where: { email: 'dispatcher@autorepair.com' },
      update: {},
      create: {
        email: 'dispatcher@autorepair.com',
        name: '李调度',
        role: UserRole.DISPATCHER,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dispatcher',
      },
    }),
    prisma.user.upsert({
      where: { email: 'inspector@autorepair.com' },
      update: {},
      create: {
        email: 'inspector@autorepair.com',
        name: '王质检',
        role: UserRole.INSPECTOR,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=inspector',
      },
    }),
    prisma.user.upsert({
      where: { email: 'viewer@autorepair.com' },
      update: {},
      create: {
        email: 'viewer@autorepair.com',
        name: '赵查看',
        role: UserRole.VIEWER,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=viewer',
      },
    }),
  ]);
  console.log('✅ 用户数据创建完成');

  const adminUser = users[0];
  const inspectorUser = users[2];

  // 2. 创建工位
  const stations = await Promise.all([
    prisma.station.upsert({
      where: { id: 'st-001' },
      update: {},
      create: { id: 'st-001', name: '1号维修工位', type: 'general', isActive: true },
    }),
    prisma.station.upsert({
      where: { id: 'st-002' },
      update: {},
      create: { id: 'st-002', name: '2号维修工位', type: 'general', isActive: true },
    }),
    prisma.station.upsert({
      where: { id: 'st-003' },
      update: {},
      create: { id: 'st-003', name: '3号快保工位', type: 'quick', isActive: true },
    }),
    prisma.station.upsert({
      where: { id: 'st-004' },
      update: {},
      create: { id: 'st-004', name: '4号钣金工位', type: 'body', isActive: true },
    }),
  ]);
  console.log('✅ 工位数据创建完成');

  // 3. 创建库存分类
  const categories = await Promise.all([
    prisma.inventoryCategory.upsert({
      where: { name: '机油滤清器' },
      update: {},
      create: { name: '机油滤清器' },
    }),
    prisma.inventoryCategory.upsert({
      where: { name: '刹车片' },
      update: {},
      create: { name: '刹车片' },
    }),
    prisma.inventoryCategory.upsert({
      where: { name: '轮胎' },
      update: {},
      create: { name: '轮胎' },
    }),
    prisma.inventoryCategory.upsert({
      where: { name: '火花塞' },
      update: {},
      create: { name: '火花塞' },
    }),
    prisma.inventoryCategory.upsert({
      where: { name: '空调滤芯' },
      update: {},
      create: { name: '空调滤芯' },
    }),
  ]);
  console.log('✅ 库存分类创建完成');

  // 4. 创建库存配件
  const inventoryItems = await Promise.all([
    prisma.inventoryItem.upsert({
      where: { sku: 'SKU-OIL-005' },
      update: {},
      create: {
        sku: 'SKU-OIL-005',
        name: '全合成机油 5W-40',
        categoryId: categories[0].id,
        quantity: 120,
        minThreshold: 30,
        unitValue: 480,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { sku: 'SKU-BP-001' },
      update: {},
      create: {
        sku: 'SKU-BP-001',
        name: '前刹车片套装',
        categoryId: categories[1].id,
        quantity: 85,
        minThreshold: 20,
        unitValue: 680,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { sku: 'SKU-BP-002' },
      update: {},
      create: {
        sku: 'SKU-BP-002',
        name: '后刹车片套装',
        categoryId: categories[1].id,
        quantity: 2,
        minThreshold: 15,
        unitValue: 580,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { sku: 'SKU-TYRE-215' },
      update: {},
      create: {
        sku: 'SKU-TYRE-215',
        name: '轮胎 215/55R17',
        categoryId: categories[2].id,
        quantity: 40,
        minThreshold: 10,
        unitValue: 2200,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { sku: 'SKU-TYRE-225' },
      update: {},
      create: {
        sku: 'SKU-TYRE-225',
        name: '轮胎 225/45R18',
        categoryId: categories[2].id,
        quantity: 3,
        minThreshold: 8,
        unitValue: 2800,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { sku: 'SKU-SP-008' },
      update: {},
      create: {
        sku: 'SKU-SP-008',
        name: '铱金火花塞',
        categoryId: categories[3].id,
        quantity: 60,
        minThreshold: 20,
        unitValue: 380,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { sku: 'SKU-AC-012' },
      update: {},
      create: {
        sku: 'SKU-AC-012',
        name: '活性炭空调滤芯',
        categoryId: categories[4].id,
        quantity: 1,
        minThreshold: 25,
        unitValue: 180,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { sku: 'SKU-BF-003' },
      update: {},
      create: {
        sku: 'SKU-BF-003',
        name: 'DOT4刹车油',
        categoryId: categories[0].id,
        quantity: 5,
        minThreshold: 10,
        unitValue: 260,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { sku: 'SKU-TF-002' },
      update: {},
      create: {
        sku: 'SKU-TF-002',
        name: 'AT变速箱油',
        categoryId: categories[0].id,
        quantity: 18,
        minThreshold: 5,
        unitValue: 1800,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { sku: 'SKU-TF-FILT' },
      update: {},
      create: {
        sku: 'SKU-TF-FILT',
        name: '变速箱滤芯',
        categoryId: categories[0].id,
        quantity: 12,
        minThreshold: 5,
        unitValue: 650,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { sku: 'SKU-COOL-01' },
      update: {},
      create: {
        sku: 'SKU-COOL-01',
        name: '长效防冻液',
        categoryId: categories[0].id,
        quantity: 25,
        minThreshold: 10,
        unitValue: 480,
      },
    }),
  ]);
  console.log('✅ 库存配件数据创建完成');

  // 5. 创建工单（最近30天）
  const vehicles = [
    { plate: '京A·12345', customer: '李明' },
    { plate: '京B·67890', customer: '王芳' },
    { plate: '沪C·54321', customer: '赵强' },
    { plate: '粤D·99999', customer: '陈静' },
    { plate: '津E·88888', customer: '刘洋' },
    { plate: '渝F·66666', customer: '周明' },
    { plate: '苏G·33333', customer: '吴华' },
    { plate: '浙H·77777', customer: '郑丽' },
  ];

  const now = new Date();
  const workorders: any[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);

    const count = Math.floor(Math.random() * 3) + 2;

    for (let j = 0; j < count; j++) {
      const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
      const station = stations[Math.floor(Math.random() * stations.length)];
      const statuses = [WorkorderStatus.COMPLETED, WorkorderStatus.COMPLETED, WorkorderStatus.COMPLETED, WorkorderStatus.IN_PROGRESS, WorkorderStatus.PENDING];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const isReworked = Math.random() < 0.08;

      const woNo = `WO${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${String(workorders.length + 1).padStart(3, '0')}`;

      const wo = await prisma.workorder.create({
        data: {
          woNo,
          vehiclePlate: vehicle.plate,
          stationId: station.id,
          userId: adminUser.id,
          status,
          isReworked,
          totalAmount: Math.floor(Math.random() * 10000) + 500,
          completedAt: status === WorkorderStatus.COMPLETED ? new Date(date.getTime() + Math.random() * 4 * 60 * 60 * 1000) : null,
          createdAt: date,
        },
      });
      workorders.push(wo);
    }
  }
  console.log(`✅ 工单数据创建完成 (${workorders.length} 条)`);

  // 6. 创建报价单
  const quoteItemsData = [
    [
      { desc: '前刹车片更换', qty: 1, price: 680, skuIdx: 1 },
      { desc: '机油更换（全合成）', qty: 1, price: 480, skuIdx: 0 },
      { desc: '工时费', qty: 2, price: 300, skuIdx: -1 },
      { desc: '空调滤芯', qty: 1, price: 180, skuIdx: 6 },
      { desc: '刹车油', qty: 1, price: 260, skuIdx: 7 },
    ],
    [
      { desc: '轮胎更换（4条）', qty: 4, price: 2200, skuIdx: 3 },
      { desc: '四轮定位', qty: 1, price: 600, skuIdx: -1 },
      { desc: '动平衡', qty: 4, price: 100, skuIdx: -1 },
      { desc: '气门嘴', qty: 4, price: 50, skuIdx: -1 },
    ],
    [
      { desc: '火花塞更换（4支）', qty: 4, price: 380, skuIdx: 5 },
      { desc: '节气门清洗', qty: 1, price: 380, skuIdx: -1 },
      { desc: '喷油嘴清洗', qty: 1, price: 450, skuIdx: -1 },
    ],
    [
      { desc: '变速箱油更换', qty: 1, price: 1800, skuIdx: 8 },
      { desc: '变速箱滤芯', qty: 1, price: 650, skuIdx: 9 },
      { desc: '防冻液更换', qty: 1, price: 480, skuIdx: 10 },
      { desc: '刹车系统深度保养', qty: 1, price: 1200, skuIdx: -1 },
      { desc: '工时费', qty: 5, price: 400, skuIdx: -1 },
    ],
  ];

  const statuses: QuoteStatus[] = [QuoteStatus.APPROVED, QuoteStatus.COMPLETED, QuoteStatus.DRAFT, QuoteStatus.APPROVED];

  for (let i = 0; i < Math.min(8, workorders.length); i++) {
    const wo = workorders[i];
    const itemSetIdx = i % quoteItemsData.length;
    const items = quoteItemsData[itemSetIdx];
    const status = statuses[i % statuses.length];

    const totalAmount = items.reduce((sum, item) => sum + item.qty * item.price, 0);

    const vehicle = vehicles.find(v => v.plate === wo.vehiclePlate);

    await prisma.quote.create({
      data: {
        quoteNo: `QT${wo.woNo.slice(2)}`,
        workorderId: wo.id,
        customerName: vehicle?.customer || '客户',
        totalAmount,
        status,
        createdAt: wo.createdAt,
        items: {
          create: items.map(item => ({
            description: item.desc,
            quantity: item.qty,
            unitPrice: item.price,
            partId: item.skuIdx >= 0 ? inventoryItems[item.skuIdx].id : null,
          })),
        },
      },
    });
  }
  console.log('✅ 报价单数据创建完成');

  // 7. 创建质检记录
  const inspectionPhotos = [
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=300&fit=crop',
  ];

  const anomalyAnnotations = [
    [{ id: 'a-001', type: 'SCRATCH', x: 20, y: 35, width: 25, height: 8, remark: '右前门划痕' },
     { id: 'a-002', type: 'DENT', x: 60, y: 50, width: 15, height: 12, remark: '后翼子板凹陷' }],
    [],
    [{ id: 'a-003', type: 'MISSING_PART', x: 45, y: 60, width: 20, height: 20, remark: '发动机护板缺失' }],
    [{ id: 'a-004', type: 'OTHER', x: 10, y: 80, width: 30, height: 15, remark: '底盘漏油需进一步检查' }],
    [],
    [{ id: 'a-005', type: 'SCRATCH', x: 70, y: 20, width: 18, height: 6, remark: '前保险杠划痕' }],
  ];

  for (let i = 0; i < Math.min(6, workorders.length); i++) {
    const wo = workorders[i];
    const annotations = anomalyAnnotations[i];

    await prisma.inspection.create({
      data: {
        workorderId: wo.id,
        inspectorId: inspectorUser.id,
        vehiclePlate: wo.vehiclePlate,
        photoUrl: inspectionPhotos[i],
        hasAnomaly: annotations.length > 0,
        annotations: annotations as any,
        createdAt: new Date(wo.createdAt.getTime() + 30 * 60 * 1000),
      },
    });
  }
  console.log('✅ 质检记录创建完成');

  // 8. 创建收银流水
  for (let i = 0; i < Math.min(15, workorders.length); i++) {
    const wo = workorders[i];
    if (wo.status !== WorkorderStatus.COMPLETED) continue;

    const types: TransactionType[] = [TransactionType.CARD, TransactionType.CASH, TransactionType.INSURANCE];
    const type = types[Math.floor(Math.random() * types.length)];

    await prisma.cashierTransaction.create({
      data: {
        transactionNo: `TXN${wo.woNo.slice(2)}`,
        workorderId: wo.id,
        amount: wo.totalAmount,
        type,
        payerName: vehicles.find(v => v.plate === wo.vehiclePlate)?.customer || '客户',
        vehiclePlate: wo.vehiclePlate,
        isSettled: true,
        settledAt: wo.completedAt,
        createdAt: wo.completedAt || wo.createdAt,
      },
    });
  }
  console.log('✅ 收银流水创建完成');

  // 9. 创建保险理赔材料
  const insuranceCompanies = ['平安保险', '人保财险', '太平洋保险', '中国人寿'];
  for (let i = 0; i < Math.min(5, workorders.length); i++) {
    const wo = workorders[i];
    const company = insuranceCompanies[i % insuranceCompanies.length];
    const statuses: InsuranceStatus[] = [InsuranceStatus.SETTLED, InsuranceStatus.APPROVED, InsuranceStatus.PENDING];
    const status = statuses[i % statuses.length];

    await prisma.insuranceClaim.create({
      data: {
        claimNo: `INS${wo.woNo.slice(2)}`,
        workorderId: wo.id,
        vehiclePlate: wo.vehiclePlate,
        insuranceCompany: company,
        claimAmount: wo.totalAmount,
        approvedAmount: status === InsuranceStatus.REJECTED ? 0 : wo.totalAmount,
        status,
        materials: [
          { type: '身份证', url: 'insurance/id-card.jpg' },
          { type: '行驶证', url: 'insurance/driver-license.jpg' },
          { type: '事故照片', url: 'insurance/accident-photo.jpg' },
        ] as any,
        submittedAt: wo.createdAt,
        settledAt: status === InsuranceStatus.SETTLED ? new Date(wo.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000) : null,
        createdAt: wo.createdAt,
      },
    });
  }
  console.log('✅ 保险理赔材料创建完成');

  console.log('🎉 所有种子数据创建完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
