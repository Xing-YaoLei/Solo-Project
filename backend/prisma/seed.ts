import { PrismaClient, Role, OrderStatus, TaskStatus, DisputeStatus, LogAction } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据...');

  const users = await prisma.user.createMany({
    data: [
      { username: 'admin', name: '系统管理员', email: 'admin@scenic.com', phone: '13800000001', role: Role.ADMIN },
      { username: 'op_manager', name: '运营经理', email: 'op@scenic.com', phone: '13800000002', role: Role.OPERATION_MANAGER },
      { username: 'ticket_staff1', name: '售票员小王', email: 'ticket1@scenic.com', phone: '13800000003', role: Role.TICKET_STAFF },
      { username: 'ticket_staff2', name: '售票员小李', email: 'ticket2@scenic.com', phone: '13800000004', role: Role.TICKET_STAFF },
      { username: 'finance', name: '财务小张', email: 'finance@scenic.com', phone: '13800000005', role: Role.FINANCE },
      { username: 'sponsor_contact', name: '赞助联络人', email: 'sponsor@scenic.com', phone: '13800000006', role: Role.SPONSOR_CONTACT },
      { username: 'performer1', name: '演员阿杰', email: 'performer1@scenic.com', phone: '13800000007', role: Role.PERFORMER },
      { username: 'performer2', name: '演员小美', email: 'performer2@scenic.com', phone: '13800000008', role: Role.PERFORMER },
    ],
    skipDuplicates: true,
  });
  console.log(`创建了 ${users.count} 个用户`);

  const now = new Date();
  const schedules = await prisma.performanceSchedule.createMany({
    data: [
      {
        title: '山水实景演出·夏季场',
        description: '大型山水实景演出，融合本地民俗文化',
        startTime: new Date(now.getFullYear(), now.getMonth(), 15, 20, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), 15, 21, 30),
        venue: '主舞台剧场',
        capacity: 500,
        status: 'scheduled',
      },
      {
        title: '民俗巡游表演',
        description: '传统民俗花车巡游',
        startTime: new Date(now.getFullYear(), now.getMonth(), 16, 14, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), 16, 16, 0),
        venue: '景区主路',
        capacity: 2000,
        status: 'scheduled',
      },
      {
        title: '夜间灯光秀',
        description: '高科技光影艺术秀',
        startTime: new Date(now.getFullYear(), now.getMonth(), 17, 21, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), 17, 22, 0),
        venue: '湖畔广场',
        capacity: 1000,
        status: 'scheduled',
      },
    ],
  });
  console.log(`创建了 ${schedules.count} 个演出排期`);

  const schedule1 = await prisma.performanceSchedule.findFirst({ where: { title: '山水实景演出·夏季场' } });
  const schedule2 = await prisma.performanceSchedule.findFirst({ where: { title: '民俗巡游表演' } });
  const schedule3 = await prisma.performanceSchedule.findFirst({ where: { title: '夜间灯光秀' } });

  if (schedule1) {
    await prisma.ticketType.createMany({
      data: [
        { scheduleId: schedule1.id, name: '普通票', price: 180.00, totalCount: 300, soldCount: 150, description: '普通观演区域', rules: '一人一票，对号入座' },
        { scheduleId: schedule1.id, name: 'VIP票', price: 380.00, totalCount: 100, soldCount: 60, description: 'VIP专属区域，含饮品', rules: 'VIP通道入场，免费提供饮品' },
        { scheduleId: schedule1.id, name: '团体票', price: 150.00, totalCount: 100, soldCount: 40, description: '10人以上团体优惠', rules: '需提前预约，凭团体证明入场' },
      ],
    });

    await prisma.sponsor.createMany({
      data: [
        { scheduleId: schedule1.id, name: '山水文旅集团', level: '钻石赞助商', amount: 500000, contactName: '王总', contactPhone: '13900000001', benefits: '冠名权、现场广告、VIP席位' },
        { scheduleId: schedule1.id, name: '本地银行', level: '黄金赞助商', amount: 200000, contactName: '李经理', contactPhone: '13900000002', benefits: '现场广告位、宣传册广告' },
        { scheduleId: schedule1.id, name: '特色餐饮连锁', level: '白银赞助商', amount: 80000, contactName: '张老板', contactPhone: '13900000003', benefits: '指定餐饮供应商' },
      ],
    });
  }

  if (schedule2) {
    await prisma.ticketType.createMany({
      data: [
        { scheduleId: schedule2.id, name: '免费观摩', price: 0.00, totalCount: 2000, soldCount: 500, description: '免费观看', rules: '无需预约，自由观看' },
      ],
    });
  }

  if (schedule3) {
    await prisma.ticketType.createMany({
      data: [
        { scheduleId: schedule3.id, name: '单人票', price: 120.00, totalCount: 500, soldCount: 300, description: '单人入场', rules: '一人一票' },
        { scheduleId: schedule3.id, name: '情侣套票', price: 200.00, totalCount: 200, soldCount: 80, description: '双人优惠', rules: '两人同时入场' },
        { scheduleId: schedule3.id, name: '家庭套票', price: 280.00, totalCount: 100, soldCount: 30, description: '2大1小', rules: '两名成人一名儿童' },
      ],
    });
  }

  const ticketType = await prisma.ticketType.findFirst({ where: { name: '普通票' } });
  if (schedule1 && ticketType) {
    const orders = await prisma.order.createMany({
      data: [
        { orderNo: 'ORD202406150001', scheduleId: schedule1.id, ticketTypeId: ticketType.id, buyerName: '张三', buyerPhone: '13912345678', quantity: 2, totalAmount: 360.00, status: OrderStatus.PAID, creatorId: 1 },
        { orderNo: 'ORD202406150002', scheduleId: schedule1.id, ticketTypeId: ticketType.id, buyerName: '李四', buyerPhone: '13912345679', quantity: 4, totalAmount: 720.00, status: OrderStatus.VERIFIED, creatorId: 2 },
        { orderNo: 'ORD202406150003', scheduleId: schedule1.id, ticketTypeId: ticketType.id, buyerName: '王五', buyerPhone: '13912345680', quantity: 1, totalAmount: 180.00, status: OrderStatus.REFUND_REQUESTED, creatorId: 1 },
      ],
    });
    console.log(`创建了 ${orders.count} 个订单`);
  }

  const adminUser = await prisma.user.findFirst({ where: { username: 'admin' } });
  if (schedule1 && adminUser) {
    const tasks = await prisma.performanceTask.createMany({
      data: [
        { scheduleId: schedule1.id, title: '舞台搭建', description: '主舞台搭建和设备调试', type: 'stage', priority: 1, status: TaskStatus.IN_PROGRESS, creatorId: adminUser.id, startTime: new Date(now.getFullYear(), now.getMonth(), 14, 8, 0), dueTime: new Date(now.getFullYear(), now.getMonth(), 14, 18, 0) },
        { scheduleId: schedule1.id, title: '演员彩排', description: '全体演员带妆彩排', type: 'rehearsal', priority: 2, status: TaskStatus.PENDING, creatorId: adminUser.id, startTime: new Date(now.getFullYear(), now.getMonth(), 14, 14, 0), dueTime: new Date(now.getFullYear(), now.getMonth(), 14, 17, 0) },
        { scheduleId: schedule1.id, title: '票务系统测试', description: '入场检票系统压力测试', type: 'ticketing', priority: 2, status: TaskStatus.PENDING, creatorId: adminUser.id, dueTime: new Date(now.getFullYear(), now.getMonth(), 15, 12, 0) },
        { scheduleId: schedule1.id, title: '安全检查', description: '消防和安全设施检查', type: 'safety', priority: 1, status: TaskStatus.COMPLETED, creatorId: adminUser.id, startTime: new Date(now.getFullYear(), now.getMonth(), 13, 9, 0), endTime: new Date(now.getFullYear(), now.getMonth(), 13, 12, 0) },
      ],
    });
    console.log(`创建了 ${tasks.count} 个任务`);
  }

  const order = await prisma.order.findFirst({ where: { orderNo: 'ORD202406150002' } });
  const ticketStaff = await prisma.user.findFirst({ where: { username: 'ticket_staff1' } });
  if (order && ticketStaff) {
    await prisma.verificationRecord.create({
      data: {
        orderId: order.id,
        verifierId: ticketStaff.id,
        quantity: 4,
        verifyMethod: 'QR_CODE',
        remark: '正常核销',
      },
    });
    console.log('创建了核销记录');
  }

  const refundOrder = await prisma.order.findFirst({ where: { orderNo: 'ORD202406150003' } });
  if (refundOrder && adminUser) {
    const dispute = await prisma.refundDispute.create({
      data: {
        orderId: refundOrder.id,
        title: '退票争议 - 演出时间变更',
        reason: '用户称演出时间与购票时显示不符，要求全额退款并赔偿',
        status: DisputeStatus.OPEN,
        handlerId: adminUser.id,
        logs: {
          create: [
            { action: LogAction.DISPUTE_OPEN, description: '用户发起退票争议，原因为演出时间变更', operatorId: adminUser.id },
          ],
        },
      },
    });
    console.log(`创建了退票争议: ${dispute.id}`);
  }

  console.log('数据初始化完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
