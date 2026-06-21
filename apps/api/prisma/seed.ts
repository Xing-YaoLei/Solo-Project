import { PrismaClient, UserRole, TaskStatus, RiskLevel, DamageStatus, RiderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      phone: '13800000000',
      role: UserRole.ADMIN,
    },
  });

  const manager = await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      username: 'manager',
      password: hashedPassword,
      name: '张经理',
      phone: '13800000001',
      role: UserRole.MANAGER,
    },
  });

  const dispatcher = await prisma.user.upsert({
    where: { username: 'dispatcher' },
    update: {},
    create: {
      username: 'dispatcher',
      password: hashedPassword,
      name: '李调度',
      phone: '13800000002',
      role: UserRole.DISPATCHER,
    },
  });

  const verifier = await prisma.user.upsert({
    where: { username: 'verifier' },
    update: {},
    create: {
      username: 'verifier',
      password: hashedPassword,
      name: '王核验',
      phone: '13800000003',
      role: UserRole.VERIFIER,
    },
  });

  const rider1 = await prisma.user.upsert({
    where: { username: 'rider001' },
    update: {},
    create: {
      username: 'rider001',
      password: hashedPassword,
      name: '骑手小王',
      phone: '13900000001',
      role: UserRole.RIDER,
    },
  });

  const rider2 = await prisma.user.upsert({
    where: { username: 'rider002' },
    update: {},
    create: {
      username: 'rider002',
      password: hashedPassword,
      name: '骑手小李',
      phone: '13900000002',
      role: UserRole.RIDER,
    },
  });

  const rider3 = await prisma.user.upsert({
    where: { username: 'rider003' },
    update: {},
    create: {
      username: 'rider003',
      password: hashedPassword,
      name: '骑手小张',
      phone: '13900000003',
      role: UserRole.RIDER,
    },
  });

  await prisma.riderProfile.upsert({
    where: { userId: rider1.id },
    update: {},
    create: {
      userId: rider1.id,
      riderCode: 'R20240001',
      status: RiderStatus.IDLE,
      totalOrders: 156,
      rating: 4.8,
      vehicleType: '电动自行车',
      vehiclePlate: '京A12345',
      idCardNo: '110101199001011234',
      currentLat: 39.9042,
      currentLng: 116.4074,
    },
  });

  await prisma.riderProfile.upsert({
    where: { userId: rider2.id },
    update: {},
    create: {
      userId: rider2.id,
      riderCode: 'R20240002',
      status: RiderStatus.ON_DELIVERY,
      totalOrders: 203,
      rating: 4.6,
      vehicleType: '电动自行车',
      vehiclePlate: '京B23456',
      idCardNo: '110101199203022345',
      currentLat: 39.9142,
      currentLng: 116.4174,
    },
  });

  await prisma.riderProfile.upsert({
    where: { userId: rider3.id },
    update: {},
    create: {
      userId: rider3.id,
      riderCode: 'R20240003',
      status: RiderStatus.OFFLINE,
      totalOrders: 89,
      rating: 4.9,
      vehicleType: '电动摩托车',
      vehiclePlate: '京C34567',
      idCardNo: '110101199505033456',
      currentLat: 39.9242,
      currentLng: 116.4274,
    },
  });

  const samplePhotos = [
    { url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600', type: 'pickup' },
    { url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600', type: 'item' },
    { url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600', type: 'delivery' },
  ];

  for (let i = 1; i <= 15; i++) {
    const riderIndex = i % 3;
    const riderId = riderIndex === 1 ? rider1.id : riderIndex === 2 ? rider2.id : rider3.id;
    const statuses = [TaskStatus.PENDING, TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS, TaskStatus.VERIFIED, TaskStatus.COMPLETED];
    const status = statuses[i % 5];

    await prisma.verificationTask.create({
      data: {
        taskNo: `VT${Date.now()}${String(i).padStart(3, '0')}`,
        orderNo: `ORD${20240000 + i}`,
        rider: { connect: { userId: riderId } },
        createdBy: { connect: { id: dispatcher.id } },
        assignedTo: { connect: { id: verifier.id } },
        status,
        pickupAddress: `北京市朝阳区建国路${80 + i}号`,
        pickupLat: 39.90 + Math.random() * 0.05,
        pickupLng: 116.40 + Math.random() * 0.05,
        deliveryAddress: `北京市海淀区中关村大街${1 + i}号`,
        deliveryLat: 39.98 + Math.random() * 0.02,
        deliveryLng: 116.31 + Math.random() * 0.02,
        itemName: ['生鲜食品', '电子产品', '服装鞋帽', '日用百货', '重要文件'][i % 5],
        itemQuantity: Math.ceil(Math.random() * 5),
        itemValue: Math.floor(Math.random() * 2000) + 100,
        estimatedAmount: Math.floor(Math.random() * 100) + 15,
        photos: i > 3 ? samplePhotos : [],
        evaluationTags: i > 5 ? ['包装完好', '配送及时', '态度良好'].slice(0, Math.floor(Math.random() * 3) + 1) : [],
        addressMatched: i > 7 ? Math.random() > 0.1 : null,
        note: i % 4 === 0 ? '客户要求优先配送' : null,
        assignedAt: status !== TaskStatus.PENDING ? new Date(Date.now() - i * 3600000) : null,
        completedAt: status === TaskStatus.COMPLETED ? new Date(Date.now() - i * 1800000) : null,
      },
    });
  }

  for (let i = 1; i <= 3; i++) {
    const task = await prisma.verificationTask.findFirst({
      skip: i * 3,
      take: 1,
    });

    if (task) {
      const reportNo = `DR${Date.now()}${String(i).padStart(3, '0')}`;
      const riskLevels = [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH] as const;
      const dmgStatuses = [DamageStatus.REPORTED, DamageStatus.COMMUNICATING, DamageStatus.REVIEW_CONFIRMED] as const;
      await prisma.damageReport.create({
        data: {
          reportNo,
          taskId: task.id,
          riderId: task.riderId,
          createdById: verifier.id,
          riskLevel: riskLevels[i - 1],
          status: dmgStatuses[i - 1],
          damageType: ['外包装破损', '内部物品损坏', '遗失'][i - 1],
          description: ['配送途中外包装盒有明显挤压痕迹', '客户收到后发现屏幕碎裂无法开机', '小包裹在中转时遗失'][i - 1],
          photos: samplePhotos,
          estimatedLoss: [50, 1500, 800][i - 1],
        },
      });
    }
  }

  const now = new Date();
  for (let d = 0; d < 30; d++) {
    const date = new Date(now.getTime() - d * 86400000);
    date.setHours(0, 0, 0, 0);

    for (let r = 1; r <= 3; r++) {
      const riderId = r === 1 ? rider1.id : r === 2 ? rider2.id : rider3.id;
      const baseOrders = r === 2 ? 30 : r === 1 ? 25 : 20;
      const variance = Math.floor(Math.random() * 15) - 5;
      const orderCount = Math.max(0, baseOrders + variance);
      const loginCount = orderCount > 0 ? Math.floor(Math.random() * 3) + 1 : 0;
      const workDuration = orderCount * 15 + Math.floor(Math.random() * 60);
      const distance = orderCount * (Math.random() * 3 + 1);

      await prisma.riderActivity.upsert({
        where: {
          riderId_date: { riderId, date },
        },
        update: {
          loginCount,
          orderCount,
          workDuration,
          distance,
        },
        create: {
          riderId,
          date,
          loginCount,
          orderCount,
          workDuration,
          distance,
        },
      });
    }
  }

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
