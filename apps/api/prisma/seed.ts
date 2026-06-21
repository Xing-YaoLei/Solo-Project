import { PrismaClient, UserRole, TaskStatus, RiskLevel, DamageStatus, RiderStatus, VerificationStep } from '@prisma/client';
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

  const riderUser1 = await prisma.user.upsert({
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

  const riderUser2 = await prisma.user.upsert({
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

  const riderUser3 = await prisma.user.upsert({
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

  const riderProfile1 = await prisma.riderProfile.upsert({
    where: { userId: riderUser1.id },
    update: {},
    create: {
      userId: riderUser1.id,
      riderCode: 'R20240001',
      status: RiderStatus.IDLE,
      totalOrders: 750,
      rating: 4.8,
      vehicleType: '电动自行车',
      vehiclePlate: '京A12345',
      idCardNo: '110101199001011234',
      joinDate: new Date('2023-03-15'),
      currentLat: 39.9042,
      currentLng: 116.4074,
    },
  });

  const riderProfile2 = await prisma.riderProfile.upsert({
    where: { userId: riderUser2.id },
    update: {},
    create: {
      userId: riderUser2.id,
      riderCode: 'R20240002',
      status: RiderStatus.ON_DELIVERY,
      totalOrders: 920,
      rating: 4.6,
      vehicleType: '电动自行车',
      vehiclePlate: '京B23456',
      idCardNo: '110101199203022345',
      joinDate: new Date('2022-11-08'),
      currentLat: 39.9142,
      currentLng: 116.4174,
    },
  });

  const riderProfile3 = await prisma.riderProfile.upsert({
    where: { userId: riderUser3.id },
    update: {},
    create: {
      userId: riderUser3.id,
      riderCode: 'R20240003',
      status: RiderStatus.OFFLINE,
      totalOrders: 410,
      rating: 4.9,
      vehicleType: '电动摩托车',
      vehiclePlate: '京C34567',
      idCardNo: '110101199505033456',
      joinDate: new Date('2024-01-20'),
      currentLat: 39.9242,
      currentLng: 116.4274,
    },
  });

  const riders = [riderProfile1, riderProfile2, riderProfile3];
  const riderNames = ['骑手小王', '骑手小李', '骑手小张'];
  const baseOrders = [25, 32, 18];

  const samplePhotos = [
    { url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600', type: 'pickup' },
    { url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600', type: 'item' },
    { url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600', type: 'delivery' },
  ];

  const itemNames = ['生鲜食品', '电子产品', '服装鞋帽', '日用百货', '重要文件', '餐饮外卖', '医药用品', '鲜花礼品'];
  const statuses = [TaskStatus.PENDING, TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS, TaskStatus.VERIFIED, TaskStatus.COMPLETED];
  const steps = [VerificationStep.PHOTO_UPLOADED, VerificationStep.TAG_REVIEWED, VerificationStep.ADDRESS_CHECKED, VerificationStep.TRACKING_CONFIRMED, VerificationStep.SUBSIDY_APPLIED];

  for (let i = 1; i <= 20; i++) {
    const riderIdx = i % 3;
    const riderProfile = riders[riderIdx];
    const statusIdx = i % 5;
    const status = statuses[statusIdx];
    const currentStep = status === TaskStatus.IN_PROGRESS || status === TaskStatus.VERIFIED || status === TaskStatus.COMPLETED
      ? steps[statusIdx]
      : null;

    const task = await prisma.verificationTask.create({
      data: {
        taskNo: `VT202406${String(i).padStart(4, '0')}`,
        orderNo: `ORD${20240600 + i}`,
        riderId: riderProfile.id,
        createdById: dispatcher.id,
        assignedToId: verifier.id,
        dispatchedById: dispatcher.id,
        status,
        currentStep,
        pickupAddress: `北京市朝阳区建国路${80 + i}号`,
        pickupLat: 39.90 + Math.random() * 0.05,
        pickupLng: 116.40 + Math.random() * 0.05,
        deliveryAddress: `北京市海淀区中关村大街${1 + i}号`,
        deliveryLat: 39.98 + Math.random() * 0.02,
        deliveryLng: 116.31 + Math.random() * 0.02,
        itemName: itemNames[i % itemNames.length],
        itemQuantity: Math.ceil(Math.random() * 5),
        itemValue: Math.floor(Math.random() * 2000) + 100,
        estimatedAmount: Math.floor(Math.random() * 60) + 15,
        photos: statusIdx >= 1 ? samplePhotos : [],
        evaluationTags: statusIdx >= 2 ? ['包装完好', '配送及时', '态度良好'].slice(0, Math.floor(Math.random() * 3) + 1) : [],
        addressMatched: statusIdx >= 3 ? Math.random() > 0.1 : null,
        addressNote: statusIdx >= 3 && Math.random() > 0.7 ? '客户备注：放在门口即可' : null,
        note: i % 4 === 0 ? '客户要求优先配送' : null,
        assignedAt: status !== TaskStatus.PENDING ? new Date(Date.now() - i * 3600000) : null,
        startedAt: status === TaskStatus.IN_PROGRESS || status === TaskStatus.VERIFIED || status === TaskStatus.COMPLETED
          ? new Date(Date.now() - i * 3000000)
          : null,
        completedAt: status === TaskStatus.COMPLETED ? new Date(Date.now() - i * 1800000) : null,
      },
    });

    if (statusIdx >= 1) {
      for (let s = 0; s <= statusIdx - 1 && s < steps.length; s++) {
        await prisma.taskStepLog.create({
          data: {
            taskId: task.id,
            step: steps[s],
            operatorId: verifier.id,
            remark: s === 0 ? '照片上传完成，共3张' : s === 1 ? '评价标签核对通过' : s === 2 ? '地址核对一致' : s === 3 ? '轨迹追踪确认' : '补贴已发放',
          },
        });
      }
    }

    if (status === TaskStatus.IN_PROGRESS || status === TaskStatus.VERIFIED || status === TaskStatus.COMPLETED) {
      const trackCount = 5 + Math.floor(Math.random() * 10);
      for (let t = 0; t < trackCount; t++) {
        await prisma.riderTrack.create({
          data: {
            taskId: task.id,
            riderId: riderProfile.id,
            latitude: 39.90 + (t / trackCount) * 0.08 + (Math.random() - 0.5) * 0.005,
            longitude: 116.40 + (t / trackCount) * 0.06 + (Math.random() - 0.5) * 0.005,
            speed: Math.random() * 8 + 2,
            heading: Math.random() * 360,
            recordedAt: new Date(Date.now() - (trackCount - t) * 120000 - i * 3600000),
          },
        });
      }
    }

    if (status === TaskStatus.COMPLETED) {
      const subsidyAmount = Math.floor(Math.random() * 15) + 5;
      await prisma.subsidyRecord.create({
        data: {
          taskId: task.id,
          riderId: riderProfile.id,
          subsidyType: ['里程补贴', '重量补贴', '夜间补贴'][i % 3],
          amount: subsidyAmount,
          ruleDetail: { rate: 3, perKm: true, base: 5 },
          remark: i % 5 === 0 ? '恶劣天气额外补贴' : null,
          appliedAt: new Date(Date.now() - i * 1800000),
          approvedAt: new Date(Date.now() - i * 1700000),
          approvedBy: verifier.id,
        },
      });
    }
  }

  const damageRiskLevels = [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL];
  const damageStatuses = [DamageStatus.REPORTED, DamageStatus.COMMUNICATING, DamageStatus.REVIEW_CONFIRMED, DamageStatus.RESOLVED];
  const damageTypes = ['外包装破损', '内部物品损坏', '物品遗失', '错发漏发', '食品变质'];
  const damageDescriptions = [
    '配送途中外包装盒有明显挤压痕迹，边角凹陷',
    '客户收到后发现电子产品屏幕碎裂，无法开机',
    '小包裹在中转时遗失，物流信息中断',
    '配送商品与订单不符，存在错发情况',
    '生鲜食品配送超时，出现变质现象',
  ];

  for (let i = 1; i <= 5; i++) {
    const task = await prisma.verificationTask.findFirst({
      skip: i * 3,
      take: 1,
      orderBy: { createdAt: 'asc' },
    });

    if (task) {
      const riskIdx = i % 4;
      const dmgStatus = damageStatuses[i % 4];
      const damageReport = await prisma.damageReport.create({
        data: {
          reportNo: `DR202406${String(i).padStart(4, '0')}`,
          taskId: task.id,
          riderId: task.riderId,
          createdById: verifier.id,
          handledById: dmgStatus !== DamageStatus.REPORTED ? manager.id : null,
          riskLevel: damageRiskLevels[riskIdx],
          status: dmgStatus,
          damageType: damageTypes[i % 5],
          description: damageDescriptions[i % 5],
          photos: samplePhotos,
          estimatedLoss: [50, 1500, 800, 320, 260][i % 5],
          actualLoss: dmgStatus !== DamageStatus.REPORTED ? [48, 1500, 0, 300, 250][i % 5] : null,
          compensation: dmgStatus === DamageStatus.RESOLVED || dmgStatus === DamageStatus.REVIEW_CONFIRMED
            ? [0, 1500, 0, 200, 260][i % 5]
            : null,
          responsibility: dmgStatus === DamageStatus.RESOLVED ? ['无责', '骑手', '平台', '商家', '骑手'][i % 5] : null,
        },
      });

      const commCount = 1 + Math.floor(Math.random() * 4);
      const senders = [
        { id: verifier.id, name: '王核验', role: 'VERIFIER' },
        { id: manager.id, name: '张经理', role: 'MANAGER' },
      ];

      for (let c = 0; c < commCount; c++) {
        const sender = senders[c % 2];
        await prisma.damageCommunication.create({
          data: {
            damageId: damageReport.id,
            senderId: sender.id,
            content: [
              '已核实物品确实存在损坏，建议按流程处理',
              '骑手反馈外包装完好，可能是商家发货时就有问题',
              '已联系客户安抚，客户希望尽快解决',
              '经核查，配送环节存在超时，建议给予一定补偿',
            ][c % 4],
            createdAt: new Date(Date.now() - (commCount - c) * 3600000),
          },
        });
      }

      if (dmgStatus === DamageStatus.REVIEW_CONFIRMED || dmgStatus === DamageStatus.RESOLVED) {
        await prisma.damageReview.create({
          data: {
            damageId: damageReport.id,
            reviewerId: manager.id,
            conclusion: ['复核通过，按全额赔偿处理', '复核通过，给予半额赔偿', '复核通过，认定为不可抗力'].shift() || '复核通过，按相应流程处理',
            suggestion: '建议加强对骑手的包裹爱护培训，并定期检查包装质量',
            approved: true,
            reviewedAt: new Date(Date.now() - commCount * 3600000 - 1800000),
          },
        });
      }
    }
  }

  const now = new Date();
  const days = 30;

  for (let d = 0; d < days; d++) {
    const date = new Date(now.getTime() - d * 86400000);
    date.setHours(0, 0, 0, 0);

    for (let r = 0; r < riders.length; r++) {
      const rider = riders[r];
      const base = baseOrders[r];

      const dayFactor = Math.sin((d / days) * Math.PI * 2) * 0.2 + 1;
      const weekendPenalty = (date.getDay() === 0 || date.getDay() === 6) ? 1.15 : 1;
      const randomFactor = 0.75 + Math.random() * 0.5;

      const orderCount = Math.max(0, Math.round(base * dayFactor * weekendPenalty * randomFactor));
      const loginCount = orderCount > 0 ? Math.max(1, Math.floor(Math.random() * 3) + 1) : (Math.random() > 0.7 ? 1 : 0);
      const workDuration = orderCount > 0 ? orderCount * 15 + Math.floor(Math.random() * 120) + 60 : 0;
      const distance = orderCount > 0 ? Math.round(orderCount * (Math.random() * 2.5 + 1.5) * 100) / 100 : 0;

      await prisma.riderActivity.upsert({
        where: {
          riderId_date: { riderId: rider.id, date },
        },
        update: {
          loginCount,
          orderCount,
          workDuration,
          distance,
        },
        create: {
          riderId: rider.id,
          date,
          loginCount,
          orderCount,
          workDuration,
          distance,
        },
      });
    }
  }

  console.log('✅ Seed data created successfully!');
  console.log(`   - Users: 6 (admin, manager, dispatcher, verifier, 3 riders)`);
  console.log(`   - Rider Profiles: 3`);
  console.log(`   - Verification Tasks: 20`);
  console.log(`   - Damage Reports: 5 (低/中/高/极高风险各有)`);
  console.log(`   - Rider Activities: ${days * 3} (${days}天 × 3人)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
