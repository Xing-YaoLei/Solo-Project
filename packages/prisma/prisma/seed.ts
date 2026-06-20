import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始播种数据...');

  const activity = await prisma.activity.upsert({
    where: { id: 'demo-activity-001' },
    update: {},
    create: {
      id: 'demo-activity-001',
      name: '2026 城市音乐节',
      description: '年度最盛大的城市音乐盛会，汇集国内外知名音乐人',
      startTime: new Date('2026-08-15T18:00:00'),
      endTime: new Date('2026-08-15T23:00:00'),
      venue: '城市体育中心',
      address: '市中心大道 888 号',
    },
  });
  console.log('活动创建:', activity.name);

  const ticketTypes = await Promise.all([
    prisma.ticketType.upsert({
      where: { id: 'tt-vip-001' },
      update: {},
      create: {
        id: 'tt-vip-001',
        activityId: activity.id,
        name: 'VIP 贵宾票',
        description: 'VIP 专属区域，尊享服务',
        price: 1888,
        originalPrice: 2288,
        totalStock: 200,
        soldCount: 156,
        perLimit: 4,
        status: 'ACTIVE',
        hasSeat: true,
        benefits: { vipLounge: true, giftBag: true, afterParty: true },
        sortOrder: 1,
      },
    }),
    prisma.ticketType.upsert({
      where: { id: 'tt-stand-001' },
      update: {},
      create: {
        id: 'tt-stand-001',
        activityId: activity.id,
        name: '看台 A 区',
        description: '舞台正对面看台，视野极佳',
        price: 688,
        originalPrice: 888,
        totalStock: 1500,
        soldCount: 1230,
        perLimit: 6,
        status: 'ACTIVE',
        hasSeat: true,
        sortOrder: 2,
      },
    }),
    prisma.ticketType.upsert({
      where: { id: 'tt-stand-002' },
      update: {},
      create: {
        id: 'tt-stand-002',
        activityId: activity.id,
        name: '看台 B 区',
        description: '侧面看台，性价比之选',
        price: 388,
        totalStock: 2000,
        soldCount: 980,
        perLimit: 8,
        status: 'ACTIVE',
        hasSeat: true,
        sortOrder: 3,
      },
    }),
    prisma.ticketType.upsert({
      where: { id: 'tt-student-001' },
      update: {},
      create: {
        id: 'tt-student-001',
        activityId: activity.id,
        name: '学生优惠票',
        description: '需出示学生证，限 B 区',
        price: 199,
        totalStock: 500,
        soldCount: 320,
        perLimit: 2,
        status: 'ACTIVE',
        hasSeat: false,
        sortOrder: 4,
      },
    }),
  ]);
  console.log('票种创建:', ticketTypes.length, '个');

  const seatMap = await prisma.seatMap.upsert({
    where: { id: 'sm-main-001' },
    update: {},
    create: {
      id: 'sm-main-001',
      activityId: activity.id,
      name: '主会场座位图',
      totalSeats: 100,
      layoutConfig: {
        rows: 10,
        cols: 10,
        sections: ['VIP', 'A', 'B'],
      },
    },
  });

  const seats: Array<{ row: string; col: string; label: string; section: string; sortX: number; sortY: number; status: string }> = [];
  for (let r = 1; r <= 10; r++) {
    for (let c = 1; c <= 10; c++) {
      const section = r <= 2 ? 'VIP' : r <= 5 ? 'A' : 'B';
      const status = (r * c) % 7 === 0 ? 'OCCUPIED' : (r * c) % 11 === 0 ? 'LOCKED' : 'AVAILABLE';
      seats.push({
        row: String.fromCharCode(64 + r),
        col: String(c).padStart(2, '0'),
        label: `${String.fromCharCode(64 + r)}${c}`,
        section,
        sortX: c,
        sortY: r,
        status,
      });
    }
  }
  for (const s of seats) {
    await prisma.seat.upsert({
      where: { seatMapId_row_col: { seatMapId: seatMap.id, row: s.row, col: s.col } },
      update: { status: s.status as any },
      create: {
        seatMapId: seatMap.id,
        ...s,
        status: s.status as any,
      },
    });
  }
  console.log('座位创建:', seats.length, '个');

  const sponsors = await Promise.all([
    prisma.sponsor.upsert({
      where: { id: 'sp-001' },
      update: {},
      create: {
        id: 'sp-001',
        activityId: activity.id,
        name: '星光银行',
        type: 'TITLE_SPONSOR',
        amount: 2000000,
        contactName: '张经理',
        contactPhone: '13800000001',
        contractNo: 'HT-2026-001',
        benefitDetails: { naming: true, stageLogo: true, booth: true },
        sortOrder: 1,
      },
    }),
    prisma.sponsor.upsert({
      where: { id: 'sp-002' },
      update: {},
      create: {
        id: 'sp-002',
        activityId: activity.id,
        name: '飞跃啤酒',
        type: 'PLATINUM',
        amount: 800000,
        contactName: '李总',
        contactPhone: '13800000002',
        contractNo: 'HT-2026-002',
        sortOrder: 2,
      },
    }),
    prisma.sponsor.upsert({
      where: { id: 'sp-003' },
      update: {},
      create: {
        id: 'sp-003',
        activityId: activity.id,
        name: '潮流服装',
        type: 'GOLD',
        amount: 300000,
        contactName: '王主管',
        contactPhone: '13800000003',
        sortOrder: 3,
      },
    }),
  ]);
  console.log('赞助商创建:', sponsors.length, '个');

  const sampleOrders = [
    { customerName: '张三', customerPhone: '13912345678', items: [{ tt: ticketTypes[0], qty: 2 }], status: 'COMPLETED' as const, total: 1888 * 2 },
    { customerName: '李四', customerPhone: '13987654321', items: [{ tt: ticketTypes[1], qty: 3 }, { tt: ticketTypes[2], qty: 2 }], status: 'PAID' as const, total: 688 * 3 + 388 * 2 },
    { customerName: '王五', customerPhone: '13600001111', items: [{ tt: ticketTypes[2], qty: 4 }], status: 'CONFIRMED' as const, total: 388 * 4 },
    { customerName: '赵六', customerPhone: '13700002222', items: [{ tt: ticketTypes[3], qty: 1 }], status: 'REFUNDING' as const, total: 199 },
    { customerName: '孙七', customerPhone: '13500003333', items: [{ tt: ticketTypes[1], qty: 5 }], status: 'DISPUTED' as const, total: 688 * 5 },
  ];

  for (let i = 0; i < sampleOrders.length; i++) {
    const so = sampleOrders[i];
    const order = await prisma.order.upsert({
      where: { orderNo: `ORD20260${i + 1}` },
      update: {},
      create: {
        orderNo: `ORD20260${i + 1}`,
        activityId: activity.id,
        customerName: so.customerName,
        customerPhone: so.customerPhone,
        customerEmail: `user${i + 1}@example.com`,
        totalAmount: so.total,
        paidAmount: so.status !== 'PENDING' ? so.total : 0,
        status: so.status,
        paidAt: so.status !== 'PENDING' ? new Date() : null,
        confirmedAt: ['CONFIRMED', 'COMPLETED', 'REFUNDING', 'DISPUTED'].includes(so.status) ? new Date() : null,
        completedAt: so.status === 'COMPLETED' ? new Date() : null,
        orderItems: {
          create: so.items.map((item, idx) => ({
            ticketTypeId: item.tt.id,
            quantity: item.qty,
            unitPrice: item.tt.price,
            subtotal: item.tt.price.toNumber() * item.qty,
          })),
        },
      },
      include: { orderItems: true },
    });

    if (['PAID', 'CONFIRMED', 'COMPLETED', 'REFUNDING', 'DISPUTED'].includes(so.status)) {
      for (const oi of order.orderItems) {
        for (let q = 0; q < oi.quantity; q++) {
          await prisma.checkInCode.create({
            data: {
              orderId: order.id,
              orderItemId: oi.id,
              activityId: activity.id,
              code: `CI${order.orderNo}-${oi.id.slice(0, 4)}-${q}`,
              ticketName: ticketTypes.find(t => t.id === oi.ticketTypeId)?.name || '',
              customerName: so.customerName,
              status: so.status === 'COMPLETED' ? 'CHECKED_IN' : 'PENDING',
              checkInAt: so.status === 'COMPLETED' ? new Date() : null,
              expireAt: new Date('2026-08-16'),
            },
          });
        }
      }
    }

    if (['PENDING', 'PAID', 'CONFIRMED', 'COMPLETED', 'REFUNDING', 'DISPUTED'].includes(so.status)) {
      const transitions = [
        { from: null, to: 'PENDING' },
        ...(so.status !== 'PENDING' ? [{ from: 'PENDING', to: 'PAID' }] : []),
        ...(['CONFIRMED', 'COMPLETED', 'REFUNDING', 'DISPUTED'].includes(so.status) ? [{ from: 'PAID', to: 'CONFIRMED' }] : []),
        ...(so.status === 'COMPLETED' ? [{ from: 'CONFIRMED', to: 'COMPLETED' }] : []),
        ...(so.status === 'REFUNDING' ? [{ from: 'CONFIRMED', to: 'REFUNDING' }] : []),
        ...(so.status === 'DISPUTED' ? [{ from: 'CONFIRMED', to: 'DISPUTED' }] : []),
      ];
      for (const t of transitions) {
        await prisma.statusHistory.create({
          data: {
            entityType: 'Order',
            entityId: order.id,
            activityId: activity.id,
            orderId: order.id,
            fromStatus: t.from,
            toStatus: t.to,
            changedBy: 'system',
            changeNote: t.from ? `状态从 ${t.from} 变更为 ${t.to}` : '创建订单',
          },
        });
      }
    }
  }
  console.log('订单创建:', sampleOrders.length, '个');

  await prisma.exceptionRecord.upsert({
    where: { exceptionNo: 'EXC-2026-001' },
    update: {},
    create: {
      exceptionNo: 'EXC-2026-001',
      activityId: activity.id,
      orderId: (await prisma.order.findUnique({ where: { orderNo: 'ORD202605' } }))?.id,
      type: 'REFUND_DISPUTE',
      title: '客户要求退票但已过退票期',
      description: '客户孙七（订单号 ORD202605）因行程变更要求全额退票，但活动已进入 7 天内不退票窗口，客户表示不满。',
      status: 'INVESTIGATING',
      severity: 'HIGH',
      impactScope: '涉及订单 1 笔，金额 3,440 元，客户已投诉至 12315',
      affectedOrders: ['ORD202605'],
      liabilityParty: 'UNCLEAR',
      deadline: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    },
  });

  await prisma.exceptionRecord.upsert({
    where: { exceptionNo: 'EXC-2026-002' },
    update: {},
    create: {
      exceptionNo: 'EXC-2026-002',
      activityId: activity.id,
      type: 'SEAT_CONFLICT',
      title: 'A 区 3 排 5 座重复售出',
      description: '系统异常导致座位 A05 被两个订单同时锁定，需人工介入处理。',
      status: 'RESOLVED',
      severity: 'MEDIUM',
      impactScope: '影响 2 位客户，涉及座位 1 个',
      affectedSeats: [{ seatMapId: seatMap.id, row: 'C', col: '05' }],
      liabilityParty: 'PLATFORM',
      liabilityDetail: '并发锁定逻辑超时导致',
      resolution: '为其中一位客户升级至 VIP 区同等价位座位',
      handlingResult: '客户均已接受，无进一步投诉',
      closedAt: new Date(),
    },
  });
  console.log('异常单创建完成');

  console.log('所有数据播种完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
