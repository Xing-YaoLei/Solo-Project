import { PrismaClient, SeatStatus, OrderSource, PaymentMethod, OrderStatus, UserRole, AnomalyType, DataSource } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  await prisma.shareLink.deleteMany();
  await prisma.lockRecord.deleteMany();
  await prisma.paymentRecord.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.order.deleteMany();
  await prisma.seatAllocation.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.dashboardSnapshot.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: '系统管理员',
      role: UserRole.admin,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@example.com',
      name: '张经理',
      role: UserRole.manager,
    },
  });

  const operator = await prisma.user.create({
    data: {
      email: 'operator@example.com',
      name: '李运营',
      role: UserRole.operator,
    },
  });

  const finance = await prisma.user.create({
    data: {
      email: 'finance@example.com',
      name: '王财务',
      role: UserRole.finance,
    },
  });

  console.log('Created users:', admin.name, manager.name, operator.name, finance.name);

  const now = new Date();
  const activityDate = new Date(now);
  activityDate.setDate(activityDate.getDate() + 30);

  const activities = await Promise.all([
    prisma.activity.create({
      data: {
        name: '2026夏季演唱会',
        venue: '国家体育场',
        startTime: activityDate,
        endTime: new Date(activityDate.getTime() + 3 * 60 * 60 * 1000),
        totalSeats: 5000,
      },
    }),
    prisma.activity.create({
      data: {
        name: '年度盛典颁奖典礼',
        venue: '会展中心',
        startTime: new Date(activityDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        endTime: new Date(activityDate.getTime() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        totalSeats: 2000,
      },
    }),
  ]);

  console.log('Created activities:', activities.map(a => a.name));

  for (const activity of activities) {
    const ticketTypes = await Promise.all([
      prisma.ticketType.create({
        data: {
          activityId: activity.id,
          name: 'VIP区',
          price: 1280,
          originalPrice: 1680,
          totalStock: 500,
          soldCount: 385,
          lockedCount: 45,
          maxPerOrder: 4,
          saleStartTime: now,
          saleEndTime: activity.startTime,
          description: 'VIP专属区域，含专属礼包',
          restrictions: ['限购4张', '不可退换'],
        },
      }),
      prisma.ticketType.create({
        data: {
          activityId: activity.id,
          name: 'A区',
          price: 880,
          originalPrice: 1080,
          totalStock: 1500,
          soldCount: 1250,
          lockedCount: 95,
          maxPerOrder: 6,
          saleStartTime: now,
          saleEndTime: activity.startTime,
          description: '内场A区，视野极佳',
          restrictions: ['限购6张'],
        },
      }),
      prisma.ticketType.create({
        data: {
          activityId: activity.id,
          name: 'B区',
          price: 580,
          originalPrice: 680,
          totalStock: 2000,
          soldCount: 1680,
          lockedCount: 120,
          maxPerOrder: 10,
          saleStartTime: now,
          saleEndTime: activity.startTime,
          description: '看台B区',
          restrictions: [],
        },
      }),
      prisma.ticketType.create({
        data: {
          activityId: activity.id,
          name: 'C区',
          price: 380,
          originalPrice: 480,
          totalStock: 1000,
          soldCount: 535,
          lockedCount: 20,
          maxPerOrder: 10,
          saleStartTime: now,
          saleEndTime: activity.startTime,
          description: '看台C区',
          restrictions: [],
        },
      }),
    ]);

    console.log(`Created ticket types for ${activity.name}`);

    const areas = ['VIP', 'A', 'B', 'C'];
    const rowsPerArea = { VIP: 5, A: 15, B: 20, C: 10 };
    const seatsPerRow = { VIP: 20, A: 25, B: 30, C: 30 };

    const seatAllocations: any[] = [];
    for (const area of areas) {
      const ticketType = ticketTypes.find(t => t.name.startsWith(area));
      for (let row = 1; row <= rowsPerArea[area as keyof typeof rowsPerArea]; row++) {
        for (let seat = 1; seat <= seatsPerRow[area as keyof typeof seatsPerRow]; seat++) {
          const random = Math.random();
          let status: SeatStatus = SeatStatus.available;
          let lockedAt: Date | undefined = undefined;
          let soldAt: Date | undefined = undefined;

          if (random < 0.7) {
            status = SeatStatus.sold;
            soldAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
          } else if (random < 0.77) {
            status = SeatStatus.locked;
            lockedAt = new Date(now.getTime() - Math.random() * 60 * 60 * 1000);
          } else if (random < 0.79) {
            status = SeatStatus.reserved;
          }

          seatAllocations.push({
            activityId: activity.id,
            area,
            row: `${row}`,
            seatNumber: `${seat}`,
            status,
            ticketTypeId: ticketType?.id,
            lockedAt,
            soldAt,
          });
        }
      }
    }

    await prisma.seatAllocation.createMany({ data: seatAllocations });
    console.log(`Created ${seatAllocations.length} seat allocations for ${activity.name}`);

    const sources = [OrderSource.online, OrderSource.offline, OrderSource.partner, OrderSource.staff];
    const paymentMethods = [PaymentMethod.alipay, PaymentMethod.wechat, PaymentMethod.card, PaymentMethod.cash, PaymentMethod.free];
    const orderStatuses = [OrderStatus.paid, OrderStatus.paid, OrderStatus.paid, OrderStatus.refunded, OrderStatus.cancelled];

    const orders: any[] = [];
    for (let i = 1; i <= 1500; i++) {
      const source = sources[Math.floor(Math.random() * sources.length)];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const ticketType = ticketTypes[Math.floor(Math.random() * ticketTypes.length)];
      const quantity = Math.floor(Math.random() * 6) + 1;
      const amount = Number(ticketType.price) * quantity;

      orders.push({
        activityId: activity.id,
        orderNo: `ORD${activity.id.slice(0, 8).toUpperCase()}${String(i).padStart(6, '0')}`,
        source,
        paymentMethod,
        amount,
        status,
        ticketTypeId: ticketType.id,
        quantity,
        buyerName: `观众${i}`,
        buyerPhone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        paidAt: status === OrderStatus.paid ? new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined,
      });
    }

    await prisma.order.createMany({ data: orders });
    console.log(`Created ${orders.length} orders for ${activity.name}`);

    const allOrders = await prisma.order.findMany({ where: { activityId: activity.id } });
    const allSeats = await prisma.seatAllocation.findMany({ where: { activityId: activity.id } });

    // ============ 报名表 (registrations) ============
    const registrations: any[] = [];
    for (const order of allOrders) {
      if (order.buyerName && order.buyerPhone) {
        registrations.push({
          activityId: activity.id,
          orderId: order.id,
          name: order.buyerName,
          phone: order.buyerPhone,
          email: order.buyerPhone + '@example.com',
          idCard: Math.random() > 0.5 ? `110101${String(Math.floor(Math.random() * 1000000000000)).padStart(12, '0')}` : null,
          ticketTypeId: order.ticketTypeId,
          quantity: order.quantity,
          dataSource: DataSource.registration_form,
          platformRefId: `REG-${order.orderNo}`,
          createdAt: order.createdAt,
        });
      }
    }
    await prisma.registration.createMany({ data: registrations });
    console.log(`Created ${registrations.length} registrations for ${activity.name}`);

    // ============ 支付流水 (payment_records) ============
    const paymentRecords: any[] = [];
    for (const order of allOrders) {
      if (order.status === OrderStatus.paid && order.paidAt) {
        paymentRecords.push({
          activityId: activity.id,
          orderId: order.id,
          transactionNo: `PAY${order.orderNo}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          amount: order.amount,
          paymentMethod: order.paymentMethod,
          status: OrderStatus.paid,
          paidAt: order.paidAt,
          dataSource: DataSource.payment_flow,
          platformRefId: `PLAT-${order.orderNo}`,
          thirdPartyRefId: order.paymentMethod === PaymentMethod.alipay 
            ? `ALIPAY${Date.now()}${Math.floor(Math.random() * 1000000)}`
            : order.paymentMethod === PaymentMethod.wechat
            ? `WXPAY${Date.now()}${Math.floor(Math.random() * 1000000)}`
            : null,
          createdAt: order.createdAt,
        });
      }
    }
    await prisma.paymentRecord.createMany({ data: paymentRecords });
    console.log(`Created ${paymentRecords.length} payment records for ${activity.name}`);

    const lockRecords: any[] = [];
    const anomalyTypes = [AnomalyType.timeout, AnomalyType.duplicate, AnomalyType.amount_mismatch, AnomalyType.manual_override];
    const lockReasons = ['用户支付中', '后台预留', '客服协助', '渠道锁定', '活动方预留'];

    for (let i = 0; i < 150; i++) {
      const seat = allSeats[Math.floor(Math.random() * allSeats.length)];
      const order = allOrders[Math.floor(Math.random() * allOrders.length)];
      const isAnomaly = Math.random() < 0.2;
      const lockDuration = Math.floor(Math.random() * 60) + 15;
      const lockedAt = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
      const expiredAt = new Date(lockedAt.getTime() + lockDuration * 60 * 1000);

      lockRecords.push({
        activityId: activity.id,
        seatAllocationId: seat.id,
        orderId: order.id,
        operatorName: [admin.name, manager.name, operator.name][Math.floor(Math.random() * 3)],
        lockReason: lockReasons[Math.floor(Math.random() * lockReasons.length)],
        lockDuration,
        lockedAt,
        expiredAt,
        isAnomaly,
        anomalyType: isAnomaly ? anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)] : undefined,
        anomalyDescription: isAnomaly ? ['锁座超时未释放', '同一座位重复锁座', '支付金额与票价不匹配', '人工覆盖锁座记录'][Math.floor(Math.random() * 4)] : undefined,
        originalRecordUrl: isAnomaly ? `https://ticketing-platform.example.com/records/${order.orderNo}` : undefined,
      });
    }

    await prisma.lockRecord.createMany({ data: lockRecords });
    console.log(`Created ${lockRecords.length} lock records for ${activity.name}`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
