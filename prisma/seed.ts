import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HOTELS_SEED = [
  { id: 'h1', name: '西湖畔精品民宿', address: '浙江省杭州市西湖区龙井路1号', roomCount: 28 },
  { id: 'h2', name: '洱海海景度假屋', address: '云南省大理市才村码头', roomCount: 18 },
  { id: 'h3', name: '丽江古城客栈', address: '云南省丽江市古城区七一街', roomCount: 22 },
  { id: 'h4', name: '三亚阳光民宿', address: '海南省三亚市海棠湾', roomCount: 35 },
  { id: 'h5', name: '成都宽窄巷子民宿', address: '四川省成都市青羊区宽巷子', roomCount: 16 },
];

const GUESTS = ['张三', '李四', '王五', '赵六', '陈七', '刘八', '周九', '吴十', '郑云', '孙悦', '马超', '朱莉', '胡军', '林峰', '徐静', '何伟'];
const PLATFORMS = ['携程', '美团', '飞猪', 'Airbnb', '途家', '同程'];
const COMPLAINT_TYPES = ['卫生问题', '设施故障', '服务态度', '噪音干扰', '押金争议', '入住延误', '房间与描述不符', '网络问题', '停车问题', '早餐问题'];
const ROOM_TYPES = ['大床房', '双床房', '家庭套房', '海景房', '山景房'];
const ID_TYPES = ['id_card', 'passport', 'other'];
const STATUS = ['confirmed', 'checked_in', 'checked_out', 'cancelled'];
const DEPOSIT_STATUS: Array<'collected' | 'refunded' | 'deducted' | 'pending'> = ['collected', 'refunded', 'deducted', 'pending'];
const COMPLAINT_SEVERITIES = ['low', 'medium', 'high'];
const COMPLAINT_STATUS = ['open', 'processing', 'resolved'];
const SENTIMENTS = ['positive', 'neutral', 'negative'];
const REVIEW_TAGS_POSITIVE = ['卫生干净', '服务热情', '位置便利', '设施齐全', '环境安静', '早餐丰富', '床品舒适'];
const REVIEW_TAGS_NEGATIVE = ['卫生差', '服务态度差', '设施老旧', '噪音大', '房间有异味', '热水不足', '网络慢', '停车难', '押金退还慢', '虫子多', '隔音差'];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function dateOffset(daysAgo: number, hours = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

async function main() {
  console.log('🌱 开始种子数据初始化...');

  await prisma.rolePermission.deleteMany();
  await prisma.shareLink.deleteMany();
  await prisma.user.deleteMany();
  await prisma.reviewTag.deleteMany();
  await prisma.review.deleteMany();
  await prisma.customerMessage.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.doorLockRecord.deleteMany();
  await prisma.cleaningSchedule.deleteMany();
  await prisma.checkinRecord.deleteMany();
  await prisma.depositRecord.deleteMany();
  await prisma.otaOrder.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.room.deleteMany();
  await prisma.hotel.deleteMany();

  const createdHotels = await Promise.all(
    HOTELS_SEED.map(h => prisma.hotel.create({ data: h }))
  );
  console.log('🏨 已创建', createdHotels.length, '家民宿');

  const roomInserts: any[] = [];
  createdHotels.forEach((hotel) => {
    for (let i = 1; i <= hotel.roomCount; i++) {
      roomInserts.push({
        hotelId: hotel.id,
        roomNumber: `${Math.floor(i / 100) + 1}${String(i % 100).padStart(2, '0')}`,
        roomType: pick(ROOM_TYPES),
        floor: Math.ceil(i / 8),
      });
    }
  });
  await prisma.room.createMany({ data: roomInserts });
  const allRooms = await prisma.room.findMany({ include: { hotel: true } });
  console.log('🛏️  已创建', allRooms.length, '间客房');

  const staffInserts: any[] = [];
  createdHotels.forEach((hotel, idx) => {
    ['张店长', '李主管', '王阿姨', '赵阿姨'].forEach((name, si) => {
      staffInserts.push({
        hotelId: hotel.id,
        name: idx === 0 ? name : `${name.slice(0,1)}${pick([2,3,4,5,6])}${name.slice(1)}`,
        role: si === 0 ? 'manager' : si === 1 ? 'supervisor' : 'cleaner',
        phone: `138${String(rand(10000000, 99999999))}`,
      });
    });
  });
  await prisma.staff.createMany({ data: staffInserts });
  const allStaff = await prisma.staff.findMany();
  console.log('👷 已创建', allStaff.length, '名员工');

  await prisma.user.createMany({
    data: [
      { email: 'admin@homestay.com', role: 'admin' },
      { email: 'manager@homestay.com', role: 'manager', hotelId: createdHotels[0].id },
      { email: 'supervisor@homestay.com', role: 'supervisor', hotelId: createdHotels[0].id },
      { email: 'investor@homestay.com', role: 'investor' },
    ],
    skipDuplicates: true,
  });
  console.log('👤 已创建用户账号');

  const orders: any[] = [];
  for (let i = 0; i < 350; i++) {
    const hotel = pick(createdHotels);
    const checkin = dateOffset(rand(1, 45), rand(12, 22));
    const nights = rand(1, 5);
    const checkout = new Date(checkin);
    checkout.setDate(checkout.getDate() + nights);
    const totalAmt = rand(200, 800) * nights;
    const depositAmt = Math.floor(totalAmt * 0.2 / 10) * 10;
    orders.push({
      orderNumber: `ORD-${10000 + i}`,
      platform: pick(PLATFORMS),
      hotelId: hotel.id,
      guestName: pick(GUESTS),
      checkinDate: checkin,
      checkoutDate: checkout,
      totalAmount: totalAmt,
      depositAmount: depositAmt,
      status: pick(STATUS),
      createdAt: dateOffset(rand(3, 60)),
    });
  }
  await prisma.otaOrder.createMany({ data: orders });
  const createdOrders = await prisma.otaOrder.findMany({ include: { hotel: true } });
  console.log('📋 已创建', createdOrders.length, '条OTA订单');

  const checkinRecords: any[] = [];
  createdOrders.filter(o => o.status !== 'cancelled').forEach((order, idx) => {
    const hasAnomaly = Math.random() < 0.08;
    checkinRecords.push({
      orderId: order.id,
      checkinDate: order.checkinDate,
      idType: pick(ID_TYPES),
      idNumber: `${rand(1000, 9999)}******${rand(1000, 9999)}`,
      isAnomaly: hasAnomaly,
      anomalyType: hasAnomaly ? pick(['证件过期', '信息不符', '多人入住未报备']) : null,
    });
  });
  await prisma.checkinRecord.createMany({ data: checkinRecords });
  console.log('🪪 已创建', checkinRecords.length, '条入住证件记录');

  const depositRecords: any[] = [];
  createdOrders.filter(o => Number(o.depositAmount) > 0).forEach(order => {
    const status = pick(DEPOSIT_STATUS);
    const total = Number(order.depositAmount);
    let refunded = 0;
    let deducted = 0;
    let reason: string | null = null;
    if (status === 'refunded') refunded = total;
    if (status === 'deducted') {
      deducted = rand(50, Math.min(total, 300));
      refunded = total - deducted;
      reason = pick(['物品损坏', '房间清洁费', '超时退房', '设施维修']);
    }
    depositRecords.push({
      orderId: order.id,
      totalAmount: total,
      status,
      refundedAmount: refunded,
      deductedAmount: deducted,
      deductionReason: reason,
    });
  });
  await prisma.depositRecord.createMany({ data: depositRecords });
  console.log('💰 已创建', depositRecords.length, '条押金记录');

  const complaintInsertObjs: any[] = [];
  const complaintMessages: any[] = [];
  for (let c = 0; c < 45; c++) {
    const order = pick(createdOrders.filter(o => o.status !== 'cancelled'));
    const severity = pick(COMPLAINT_SEVERITIES);
    const status = pick(COMPLAINT_STATUS);
    const complaintId = `cmp-${c}-${Date.now()}`;
    complaintInsertObjs.push({
      id: complaintId,
      orderId: order.id,
      type: pick(COMPLAINT_TYPES),
      severity,
      status,
      createdAt: dateOffset(rand(0, 20), rand(8, 22)),
      resolvedAt: status === 'resolved' ? dateOffset(rand(0, 2), rand(10, 20)) : null,
    });
    const msgCount = rand(2, 6);
    for (let m = 0; m < msgCount; m++) {
      const sender: string = m === 0 ? 'guest'
        : (m === msgCount - 1 && status === 'resolved') ? 'system'
        : pick(['guest', 'staff']);
      const content = sender === 'guest'
        ? pick(['房间卫生太差了，床上有头发', '空调坏了，晚上很热', '服务员态度很不好', '隔壁太吵了，睡不着', '押金什么时候退？', '浴室没有热水'])
        : sender === 'staff'
        ? pick(['非常抱歉给您带来不好的体验', '我们马上安排人过去处理', '已为您安排换房，请稍等', '押金将在3个工作日内退还', '已联系维修人员上门'])
        : '客诉已处理完成，感谢您的反馈';
      complaintMessages.push({
        complaintId,
        sender,
        content,
        timestamp: dateOffset(rand(0, 7), rand(6, 23)),
        attachments: Math.random() > 0.7 ? ['/images/proof1.jpg'] : [],
      });
    }
  }
  await prisma.complaint.createMany({ data: complaintInsertObjs });
  await prisma.customerMessage.createMany({ data: complaintMessages });
  console.log('📣 已创建', complaintInsertObjs.length, '条客诉，', complaintMessages.length, '条消息');

  const reviews: any[] = [];
  const reviewTags: any[] = [];
  for (let r = 0; r < 220; r++) {
    const order = pick(createdOrders.filter(o => o.status === 'checked_out'));
    const rating = rand(3, 5);
    const isPositive = rating >= 4;
    const tagPool = isPositive ? REVIEW_TAGS_POSITIVE : REVIEW_TAGS_NEGATIVE;
    const tagCount = rand(1, 3);
    const usedTags = new Set<string>();
    const reviewId = `rev-${r}-${Date.now()}`;
    reviews.push({
      id: reviewId,
      orderId: order.id,
      rating,
      content: isPositive ? '入住体验很好，下次还会再来！' : '整体一般，有一些需要改进的地方。',
      platform: order.platform,
      reviewDate: new Date(order.checkoutDate.getTime() + rand(1, 3) * 86400000),
    });
    for (let t = 0; t < tagCount; t++) {
      const tagName = pick(tagPool);
      if (usedTags.has(tagName)) continue;
      usedTags.add(tagName);
      const sentiment = isPositive ? 'positive' : 'negative';
      const isAnomaly = !isPositive && Math.random() < 0.25;
      reviewTags.push({
        reviewId,
        tagName,
        sentiment,
        isAnomaly,
      });
    }
  }
  await prisma.review.createMany({ data: reviews });
  await prisma.reviewTag.createMany({ data: reviewTags });
  console.log('⭐ 已创建', reviews.length, '条点评，', reviewTags.length, '个标签');

  const schedules: any[] = [];
  const doorRecords: any[] = [];
  for (let s = 0; s < 280; s++) {
    const room = pick(allRooms);
    const staff = pick(allStaff.filter(st => st.role === 'cleaner'));
    const scheduled = dateOffset(rand(0, 30), rand(9, 15));
    const delayMin = Math.random() < 0.88 ? rand(-10, 30) : rand(31, 120);
    const actualStart = new Date(scheduled.getTime() + delayMin * 60000);
    const actualEnd = new Date(actualStart.getTime() + rand(30, 90) * 60000);
    const order = pick(createdOrders.filter(o => o.hotelId === room.hotelId));
    const punctuality = delayMin <= 30 ? 100 : Math.max(0, 100 - (delayMin - 30));
    const scheduleId = `sch-${s}-${Date.now()}`;
    schedules.push({
      id: scheduleId,
      orderId: order?.id,
      roomId: room.id,
      staffId: staff?.id,
      scheduledTime: scheduled,
      actualStartTime: actualStart,
      actualEndTime: actualEnd,
      status: 'completed',
      punctualityScore: punctuality,
    });
    const eventCount = rand(2, 4);
    for (let e = 0; e < eventCount; e++) {
      doorRecords.push({
        roomId: room.id,
        cleaningScheduleId: scheduleId,
        eventType: pick(['checkin', 'cleaning', 'checkout']),
        timestamp: new Date(actualStart.getTime() + e * rand(5, 20) * 60000),
        operator: staff?.name || 'system',
        success: Math.random() > 0.05,
      });
    }
  }
  await prisma.cleaningSchedule.createMany({ data: schedules });
  await prisma.doorLockRecord.createMany({ data: doorRecords });
  console.log('🧹 已创建', schedules.length, '条保洁排班，', doorRecords.length, '条门锁记录');

  await prisma.rolePermission.createMany({
    data: [
      {
        roleName: 'admin',
        permissions: { canViewAllHotels: true, canViewDetails: true, canExport: true, canShare: true, canAdjustSchedule: true },
        dataFilters: { hotelIds: null, timeRangeDays: 365 },
      },
      {
        roleName: 'manager',
        permissions: { canViewAllHotels: false, canViewDetails: true, canExport: true, canShare: true, canAdjustSchedule: true },
        dataFilters: { hotelIds: 'assigned', timeRangeDays: 90 },
      },
      {
        roleName: 'supervisor',
        permissions: { canViewAllHotels: false, canViewDetails: true, canExport: false, canShare: false, canAdjustSchedule: true },
        dataFilters: { hotelIds: 'assigned', timeRangeDays: 30 },
      },
      {
        roleName: 'investor',
        permissions: { canViewAllHotels: true, canViewDetails: false, canExport: true, canShare: false, canAdjustSchedule: false },
        dataFilters: { hotelIds: null, timeRangeDays: 365 },
      },
    ],
    skipDuplicates: true,
  });
  console.log('🔐 已创建角色权限配置');

  console.log('✅ 种子数据初始化完成！');
}

main()
  .catch((e) => { console.error('❌ 种子数据失败:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
