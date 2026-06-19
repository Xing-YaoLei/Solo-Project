import type {
  CheckinRecord,
  DepositRecord,
  ComplaintEvidence,
  ReviewTag,
  DashboardSummary,
  CleaningPunctuality,
  UserRole,
  DataScope,
} from '@/types';
import { calculatePunctualityRate, CLEANING_PUNCTUALITY_RULE } from './utils';

const HOTELS = [
  { id: 'h1', name: '西湖畔精品民宿' },
  { id: 'h2', name: '洱海海景度假屋' },
  { id: 'h3', name: '丽江古城客栈' },
  { id: 'h4', name: '三亚阳光民宿' },
  { id: 'h5', name: '成都宽窄巷子民宿' },
];

export { HOTELS };

const GUEST_NAMES = [
  '张三', '李四', '王五', '赵六', '陈七', '刘八', '周九', '吴十',
  '郑云', '孙悦', '马超', '朱莉', '胡军', '林峰', '徐静', '何伟',
];

const PLATFORMS = ['携程', '美团', '飞猪', 'Airbnb', '途家', '同程'];

const COMPLAINT_TYPES = [
  '卫生问题', '设施故障', '服务态度', '噪音干扰', '押金争议',
  '入住延误', '房间与描述不符', '网络问题', '停车问题', '早餐问题',
];

const REVIEW_TAGS = [
  { name: '卫生干净', sentiment: 'positive' as const },
  { name: '服务热情', sentiment: 'positive' as const },
  { name: '位置便利', sentiment: 'positive' as const },
  { name: '设施齐全', sentiment: 'positive' as const },
  { name: '环境安静', sentiment: 'positive' as const },
  { name: '早餐丰富', sentiment: 'positive' as const },
  { name: '床品舒适', sentiment: 'positive' as const },
  { name: '卫生差', sentiment: 'negative' as const },
  { name: '服务态度差', sentiment: 'negative' as const },
  { name: '设施老旧', sentiment: 'negative' as const },
  { name: '噪音大', sentiment: 'negative' as const },
  { name: '房间有异味', sentiment: 'negative' as const },
  { name: '热水不足', sentiment: 'negative' as const },
  { name: '网络慢', sentiment: 'negative' as const },
  { name: '停车难', sentiment: 'negative' as const },
  { name: '押金退还慢', sentiment: 'negative' as const },
  { name: '虫子多', sentiment: 'negative' as const },
  { name: '隔音差', sentiment: 'negative' as const },
];

function randomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return date.toISOString();
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateCheckinTrend(days: number = 30): CheckinRecord[] {
  const records: CheckinRecord[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const hotel = randomItem(HOTELS);
    const total = randomInt(8, 25);
    const anomaly = randomInt(0, 3);

    records.push({
      id: `ci-${i}`,
      date: dateStr,
      hotelId: hotel.id,
      hotelName: hotel.name,
      idType: randomItem(['id_card', 'passport', 'other']),
      totalCount: total,
      anomalyCount: anomaly,
      anomalyRate: total > 0 ? anomaly / total : 0,
      anomalyType: anomaly > 0 ? ['证件过期', '信息不符', '多人入住'].slice(0, randomInt(1, 2)) : [],
    });
  }

  return records;
}

export function generateDepositRecords(count: number = 50): DepositRecord[] {
  const records: DepositRecord[] = [];
  const statuses: Array<'collected' | 'refunded' | 'deducted' | 'pending'> = [
    'collected', 'refunded', 'deducted', 'pending',
  ];

  for (let i = 0; i < count; i++) {
    const status = randomItem(statuses);
    const totalAmount = randomInt(200, 1000);
    const refunded = status === 'refunded' ? totalAmount : status === 'deducted' ? randomInt(0, totalAmount - 50) : 0;
    const deducted = status === 'deducted' ? totalAmount - refunded : 0;

    records.push({
      id: `dep-${i}`,
      orderId: `ORD-${String(randomInt(10000, 99999))}`,
      guestName: randomItem(GUEST_NAMES),
      hotelName: randomItem(HOTELS).name,
      totalAmount,
      status,
      collectedAmount: totalAmount,
      refundedAmount: refunded,
      deductedAmount: deducted,
      deductionReason: status === 'deducted' ? randomItem(['物品损坏', '房间清洁费', '超时退房', '设施维修']) : undefined,
      createdAt: randomDate(30),
      updatedAt: randomDate(7),
    });
  }

  return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function generateComplaints(count: number = 15): ComplaintEvidence[] {
  const complaints: ComplaintEvidence[] = [];
  const severities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
  const statuses: Array<'open' | 'processing' | 'resolved'> = ['open', 'processing', 'resolved'];

  for (let i = 0; i < count; i++) {
    const severity = randomItem(severities);
    const status = randomItem(statuses);
    const messageCount = randomInt(2, 6);
    const messages = [];

    for (let j = 0; j < messageCount; j++) {
      const sender = (j === 0 ? 'guest' : j === messageCount - 1 && status === 'resolved' ? 'system' : randomItem(['guest', 'staff'])) as 'guest' | 'staff' | 'system';
      messages.push({
        id: `msg-${i}-${j}`,
        sender,
        content: sender === 'guest'
          ? randomItem([
              '房间卫生太差了，床上有头发',
              '空调坏了，晚上很热',
              '服务员态度很不好',
              '隔壁太吵了，睡不着',
              '押金什么时候退？',
              '浴室没有热水',
            ])
          : sender === 'staff'
          ? randomItem([
              '非常抱歉给您带来不好的体验',
              '我们马上安排人过去处理',
              '已为您安排换房，请稍等',
              '押金将在3个工作日内退还',
              '已联系维修人员上门',
            ])
          : '客诉已处理完成，感谢您的反馈',
        timestamp: randomDate(7),
        attachments: Math.random() > 0.7 ? JSON.stringify(['/images/attachment1.jpg']) : JSON.stringify([]),
      });
    }

    complaints.push({
      id: `cmp-${i}`,
      orderId: `ORD-${String(randomInt(10000, 99999))}`,
      guestName: randomItem(GUEST_NAMES),
      hotelName: randomItem(HOTELS).name,
      complaintType: randomItem(COMPLAINT_TYPES),
      severity,
      messages: messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
      relatedRecords: {
        doorLockRecords: [`dlr-${randomInt(1, 100)}`],
        cleaningRecords: [`clr-${randomInt(1, 100)}`],
      },
      createdAt: randomDate(15),
      resolvedAt: status === 'resolved' ? randomDate(7) : undefined,
      status,
    });
  }

  return complaints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function generateReviewTags(): ReviewTag[] {
  return REVIEW_TAGS.map((tag, index) => {
    const count = randomInt(5, 150);
    const isAnomaly = tag.sentiment === 'negative' && count > 30;
    return {
      id: `tag-${index}`,
      tagName: tag.name,
      count,
      sentiment: tag.sentiment,
      isAnomaly,
      anomalyReason: isAnomaly ? `该标签近7天出现${count}次，超过阈值30次，需关注` : undefined,
      trend: randomItem(['up', 'down', 'stable']) as 'up' | 'down' | 'stable',
      relatedReviews: Array.from({ length: Math.min(count, 5) }, (_, i) => `rev-${index}-${i}`),
    };
  }).sort((a, b) => b.count - a.count);
}

export function generateCleaningPunctuality(): CleaningPunctuality {
  const totalCount = randomInt(200, 350);
  const onTimeCount = Math.floor(totalCount * (0.85 + Math.random() * 0.12));
  const delayedCount = totalCount - onTimeCount;
  const now = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);

  return {
    onTimeCount,
    delayedCount,
    totalCount,
    punctualityRate: calculatePunctualityRate(onTimeCount, totalCount),
    timeRange: { start, end: now },
    calculationRule: CLEANING_PUNCTUALITY_RULE,
  };
}

export function generateDashboardSummary(role: UserRole = 'admin'): DashboardSummary {
  const checkinTrend = generateCheckinTrend(30);
  const depositRecords = generateDepositRecords(50);
  const complaints = generateComplaints(15);
  const tags = generateReviewTags();
  const punctuality = generateCleaningPunctuality();

  const depositBreakdown = {
    total: depositRecords.reduce((sum, d) => sum + d.totalAmount, 0),
    refunded: depositRecords.reduce((sum, d) => sum + d.refundedAmount, 0),
    deducted: depositRecords.reduce((sum, d) => sum + d.deductedAmount, 0),
    pending: depositRecords.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.totalAmount, 0),
  };

  const anomalyTags = tags.filter(t => t.isAnomaly);

  const totalOrders = randomInt(500, 800);
  const complaintCount = complaints.filter(c => c.status !== 'resolved').length;

  return {
    metrics: {
      totalOrders,
      cleaningPunctualityRate: punctuality.punctualityRate,
      complaintRate: complaintCount / totalOrders,
      depositAnomalyRate: depositRecords.filter(d => d.status === 'deducted').length / depositRecords.length,
      reviewAverageScore: 4.3 + Math.random() * 0.5,
      activeHotels: role === 'admin' ? HOTELS.length : randomInt(1, 3),
      occupancyRate: 0.65 + Math.random() * 0.25,
      revenueGrowth: -0.05 + Math.random() * 0.2,
    },
    punctuality,
    checkinTrend,
    depositBreakdown,
    recentComplaints: complaints.slice(0, 5),
    anomalyTags,
  };
}

export function generateDataScope(role: UserRole): DataScope {
  const now = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);

  const hotelMap: Record<UserRole, string[]> = {
    admin: HOTELS.map(h => h.id),
    manager: [HOTELS[0].id, HOTELS[1].id],
    supervisor: [HOTELS[0].id],
    investor: [],
  };

  return {
    role,
    hotelIds: hotelMap[role].length > 0 ? hotelMap[role] : undefined,
    timeRange: {
      start: start.toISOString(),
      end: now.toISOString(),
    },
  };
}

export function filterByDataScope<T extends { hotelName?: string }>(
  data: T[],
  dataScope: DataScope
): T[] {
  if (!dataScope.hotelIds || dataScope.hotelIds.length === 0) {
    return data;
  }

  const allowedHotelNames = HOTELS
    .filter(h => dataScope.hotelIds!.includes(h.id))
    .map(h => h.name);

  return data.filter(item => 
    !item.hotelName || allowedHotelNames.includes(item.hotelName)
  );
}
