import {
  type DashboardOverview,
  type SeatTrendDataPoint,
  type AreaHeatmapData,
  type OrderComposition,
  type TicketTypeDetail,
  type LockRecordDetail,
  CHART_COLORS,
  OCCUPANCY_RATE_SPEC,
} from '@/types';
import { AnomalyType } from '@prisma/client';

const now = new Date();

export function generateMockOverview(): DashboardOverview {
  const totalSeats = 5000;
  const soldSeats = 3850;
  const lockedSeats = 280;
  const reservedSeats = 70;
  const anomalyCount = 12;

  return {
    totalSeats,
    soldSeats,
    occupancyRate: soldSeats / (totalSeats - reservedSeats),
    lockedSeats,
    anomalyCount,
    lastRefreshedAt: now,
    occupancyRateSpec: {
      ...OCCUPANCY_RATE_SPEC,
      updateTime: now,
    },
  };
}

export function generateMockSeatTrend(): SeatTrendDataPoint[] {
  const data: SeatTrendDataPoint[] = [];
  const days = 30;
  let cumulativeSold = 0;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const baseSold = Math.floor(50 + Math.random() * 150);
    const locked = Math.floor(20 + Math.random() * 30);
    const available = Math.floor(500 + Math.random() * 200);
    const reserved = 70;

    cumulativeSold += baseSold;

    data.push({
      date: date.toISOString().split('T')[0],
      timestamp: date.getTime(),
      sold: baseSold,
      locked,
      available,
      reserved,
      cumulativeSold,
    });
  }

  return data;
}

export function generateMockAreaHeatmap(): AreaHeatmapData[] {
  const areas = [
    { name: 'VIP区', total: 500, rows: 5, seatsPerRow: 20 },
    { name: 'A区', total: 1500, rows: 15, seatsPerRow: 25 },
    { name: 'B区', total: 2000, rows: 20, seatsPerRow: 30 },
    { name: 'C区', total: 1000, rows: 10, seatsPerRow: 30 },
  ];

  return areas.map((area) => {
    const soldSeats = Math.floor(area.total * (0.6 + Math.random() * 0.35));
    const rows = [];
    for (let r = 1; r <= area.rows; r++) {
      const rowSold = Math.floor(area.seatsPerRow * (0.5 + Math.random() * 0.45));
      rows.push({
        row: `${r}`,
        total: area.seatsPerRow,
        sold: rowSold,
        rate: rowSold / area.seatsPerRow,
      });
    }
    return {
      area: area.name,
      totalSeats: area.total,
      soldSeats,
      occupancyRate: soldSeats / area.total,
      rows,
    };
  });
}

export function generateMockOrderComposition(): OrderComposition {
  return {
    bySource: [
      { name: 'online', value: 856, label: '线上购票' },
      { name: 'offline', value: 324, label: '线下购票' },
      { name: 'partner', value: 218, label: '渠道合作' },
      { name: 'staff', value: 102, label: '内部员工' },
    ],
    byPaymentMethod: [
      { name: 'alipay', value: 642, label: '支付宝' },
      { name: 'wechat', value: 587, label: '微信支付' },
      { name: 'card', value: 156, label: '银行卡' },
      { name: 'cash', value: 89, label: '现金' },
      { name: 'free', value: 26, label: '赠票' },
    ],
    byTicketType: [
      { name: 'VIP区', value: 385, label: 'VIP区' },
      { name: 'A区', value: 620, label: 'A区' },
      { name: 'B区', value: 498, label: 'B区' },
      { name: 'C区', value: 297, label: 'C区' },
    ],
    byDate: Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (13 - i));
      return {
        date: d.toISOString().split('T')[0],
        count: Math.floor(80 + Math.random() * 120),
        amount: Math.floor(50000 + Math.random() * 100000),
      };
    }),
    totalAmount: 12580680,
    totalOrders: 1500,
  };
}

export function generateMockTicketTypes(): TicketTypeDetail[] {
  const types = [
    { name: 'VIP区', price: 1280, originalPrice: 1680, total: 500, sold: 385, locked: 45, max: 4 },
    { name: 'A区', price: 880, originalPrice: 1080, total: 1500, sold: 1250, locked: 95, max: 6 },
    { name: 'B区', price: 580, originalPrice: 680, total: 2000, sold: 1680, locked: 120, max: 10 },
    { name: 'C区', price: 380, originalPrice: 480, total: 1000, sold: 535, locked: 20, max: 10 },
  ];

  const saleStart = new Date(now);
  saleStart.setDate(saleStart.getDate() - 30);
  const saleEnd = new Date(now);
  saleEnd.setDate(saleEnd.getDate() + 30);

  return types.map((t, i) => ({
    id: `ticket-${i + 1}`,
    name: t.name,
    price: t.price,
    originalPrice: t.originalPrice,
    discount: (t.originalPrice - t.price) / t.originalPrice,
    totalStock: t.total,
    soldCount: t.sold,
    lockedCount: t.locked,
    remainingCount: t.total - t.sold - t.locked,
    occupancyRate: t.sold / t.total,
    maxPerOrder: t.max,
    saleStartTime: saleStart,
    saleEndTime: saleEnd,
    description: t.name === 'VIP区' ? 'VIP专属区域，含专属礼包' : `${t.name}座位`,
    restrictions: t.max < 10 ? [`限购${t.max}张`] : [],
  }));
}

export function generateMockLockRecords(): LockRecordDetail[] {
  const records: LockRecordDetail[] = [];
  const areas = ['VIP', 'A', 'B', 'C'];
  const operators = ['系统管理员', '张经理', '李运营'];
  const reasons = ['用户支付中', '后台预留', '客服协助', '渠道锁定', '活动方预留'];
  const anomalyTypes = [AnomalyType.timeout, AnomalyType.duplicate, AnomalyType.amount_mismatch, AnomalyType.manual_override];
  const anomalyDescriptions = ['锁座超时未释放', '同一座位重复锁座', '支付金额与票价不匹配', '人工覆盖锁座记录'];

  for (let i = 0; i < 50; i++) {
    const area = areas[Math.floor(Math.random() * areas.length)];
    const row = Math.floor(Math.random() * 20) + 1;
    const seat = Math.floor(Math.random() * 30) + 1;
    const isAnomaly = Math.random() < 0.25;
    const anomalyIndex = Math.floor(Math.random() * anomalyTypes.length);
    const lockDuration = Math.floor(Math.random() * 60) + 15;
    const lockedAt = new Date(now.getTime() - Math.random() * 48 * 60 * 60 * 1000);
    const expiredAt = new Date(lockedAt.getTime() + lockDuration * 60 * 1000);
    const isReleased = Math.random() < 0.6;
    const isExpired = expiredAt < now && !isReleased;

    let status: 'active' | 'expired' | 'released' = 'active';
    if (isReleased) status = 'released';
    else if (isExpired) status = 'expired';

    records.push({
      id: `lock-${i + 1}`,
      seatInfo: `${area}区${row}排${seat}号`,
      area,
      row: `${row}`,
      seatNumber: `${seat}`,
      orderNo: isAnomaly ? `ORD2026${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}` : null,
      operatorName: operators[Math.floor(Math.random() * operators.length)],
      lockReason: reasons[Math.floor(Math.random() * reasons.length)],
      lockDuration,
      lockedAt,
      expiredAt,
      releasedAt: isReleased ? new Date(lockedAt.getTime() + Math.random() * lockDuration * 30 * 1000) : null,
      isAnomaly,
      anomalyType: isAnomaly ? anomalyTypes[anomalyIndex] : null,
      anomalyDescription: isAnomaly ? anomalyDescriptions[anomalyIndex] : null,
      originalRecordUrl: isAnomaly ? `https://ticketing-platform.example.com/records/ORD2026${String(i).padStart(6, '0')}` : null,
      status,
    });
  }

  return records.sort((a, b) => {
    if (a.isAnomaly && !b.isAnomaly) return -1;
    if (!a.isAnomaly && b.isAnomaly) return 1;
    return b.lockedAt.getTime() - a.lockedAt.getTime();
  });
}

export function getChartColor(index: number): string {
  const colors = Object.values(CHART_COLORS);
  return colors[index % colors.length];
}
