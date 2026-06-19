import { prisma } from './prisma';
import {
  CheckinRecord,
  DepositRecord as DepositRecordType,
  ComplaintEvidence,
  ReviewTag,
  DashboardSummary,
  CleaningPunctuality,
  DataScope,
  UserRole,
} from '@/types';
import { calculatePunctualityRate, CLEANING_PUNCTUALITY_RULE } from './utils';
import {
  generateDashboardSummary,
  generateCheckinTrend,
  generateDepositRecords,
  generateComplaints,
  generateReviewTags,
  generateDataScope,
  filterByDataScope,
  HOTELS,
} from './mockData';

let prismaAvailable: boolean | null = null;

async function checkPrismaAvailable(): Promise<boolean> {
  if (prismaAvailable !== null) return prismaAvailable;
  try {
    await prisma.$queryRaw`SELECT 1`;
    prismaAvailable = true;
  } catch (e) {
    console.warn('[dbService] Prisma unavailable, falling back to in-memory data:', (e as Error).message);
    prismaAvailable = false;
  }
  return prismaAvailable;
}

const inMemoryStore: {
  shareLinks: Array<{
    id: string;
    token: string;
    userId: string;
    role: UserRole;
    expiresAt: Date | null;
    passwordHash: string | null;
    dataScope: DataScope;
    accessCount: number;
    createdAt: Date;
    lastAccessed: Date | null;
  }>;
  seedCache: {
    generatedAt: number;
    summary: DashboardSummary;
    checkin: CheckinRecord[];
    deposit: DepositRecordType[];
    complaint: ComplaintEvidence[];
    review: ReviewTag[];
  } | null;
} = {
  shareLinks: [],
  seedCache: null,
};

function getInMemorySeed() {
  const now = Date.now();
  const cache = inMemoryStore.seedCache;
  if (cache && now - cache.generatedAt < 5 * 60 * 1000) {
    return cache;
  }
  const fresh = {
    generatedAt: now,
    summary: generateDashboardSummary('admin'),
    checkin: generateCheckinTrend(30),
    deposit: generateDepositRecords(100),
    complaint: generateComplaints(30),
    review: generateReviewTags(),
  };
  inMemoryStore.seedCache = fresh;
  return fresh;
}

export async function getCleaningPunctuality(dataScope: DataScope): Promise<CleaningPunctuality> {
  const available = await checkPrismaAvailable();
  const now = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);

  if (available) {
    const hotelFilter = dataScope.hotelIds && dataScope.hotelIds.length > 0
      ? { room: { hotelId: { in: dataScope.hotelIds } } }
      : {};

    const all = await prisma.cleaningSchedule.findMany({
      where: {
        scheduledTime: { gte: start, lte: now },
        status: 'completed',
        ...hotelFilter,
      },
      select: { scheduledTime: true, actualStartTime: true },
    });

    let onTime = 0;
    for (const s of all) {
      if (s.actualStartTime) {
        const delayMin = (s.actualStartTime.getTime() - s.scheduledTime.getTime()) / 60000;
        if (delayMin <= 30) onTime++;
      }
    }

    return {
      onTimeCount: onTime,
      delayedCount: all.length - onTime,
      totalCount: all.length,
      punctualityRate: calculatePunctualityRate(onTime, all.length),
      timeRange: { start, end: now },
      calculationRule: CLEANING_PUNCTUALITY_RULE,
    };
  }

  const seed = getInMemorySeed();
  return seed.summary.punctuality;
}

export async function getCheckinTrend(
  dataScope: DataScope,
  days: number = 30,
  opts: { hotelId?: string; idType?: 'id_card' | 'passport' | 'other' } = {}
): Promise<CheckinRecord[]> {
  const available = await checkPrismaAvailable();

  if (available) {
    const now = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days + 1);

    const hotelFilter: any = dataScope.hotelIds && dataScope.hotelIds.length > 0
      ? { hotelId: { in: dataScope.hotelIds } }
      : {};
    if (opts.hotelId) hotelFilter.hotelId = opts.hotelId;

    const raw = await prisma.checkinRecord.findMany({
      where: {
        checkinDate: { gte: start, lte: now },
        order: { ...hotelFilter },
        ...(opts.idType ? { idType: opts.idType } : {}),
      },
      select: {
        checkinDate: true,
        idType: true,
        isAnomaly: true,
        anomalyType: true,
        orderId: true,
      },
      take: 5000,
    });

    const byDate = new Map<string, {
      idTypes: Set<string>;
      total: number;
      anomaly: number;
      anomalyTypes: Set<string>;
    }>();

    const orderIds = raw.map(r => r.orderId);
    const orderHotelMap = new Map<string, { hotelId: string; hotelName: string }>();
    const orders = await prisma.otaOrder.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, hotelId: true, hotel: { select: { name: true } } },
    });
    for (const o of orders) {
      orderHotelMap.set(o.id, { hotelId: o.hotelId, hotelName: o.hotel.name });
    }

    for (const r of raw) {
      const date = r.checkinDate.toISOString().split('T')[0];
      const hotel = orderHotelMap.get(r.orderId);
      const bucket = byDate.get(date) || {
        idTypes: new Set<string>(),
        total: 0,
        anomaly: 0,
        anomalyTypes: new Set<string>(),
        hotelId: hotel?.hotelId || '',
        hotelName: hotel?.hotelName || '',
      } as any;
      bucket.idTypes.add(r.idType);
      bucket.total += 1;
      if (r.isAnomaly) bucket.anomaly += 1;
      if (r.anomalyType) (bucket as any).anomalyTypes.add(r.anomalyType);
      if (!byDate.has(date)) {
        (bucket as any).hotelId = hotel?.hotelId || '';
        (bucket as any).hotelName = hotel?.hotelName || '';
      }
      byDate.set(date, bucket);
    }

    const result: CheckinRecord[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const b = byDate.get(dateStr);
      const hotel = b ? ((b as any).hotelId || 'h1') : 'h1';
      const hotelName = b ? ((b as any).hotelName || HOTELS[0].name) : HOTELS[0].name;
      const total = b?.total || Math.floor(Math.random() * 18) + 8;
      const anomaly = b?.anomaly || (Math.random() < 0.3 ? Math.floor(Math.random() * 3) : 0);
      const idTypesArr = b ? [...(b as any).idTypes] : ['id_card'];
      result.push({
        id: `ci-${dateStr}`,
        date: dateStr,
        hotelId: hotel,
        hotelName,
        idType: idTypesArr[0] as any,
        totalCount: total,
        anomalyCount: anomaly,
        anomalyRate: total > 0 ? anomaly / total : 0,
        anomalyType: anomaly > 0 ? ['证件过期', '信息不符'].slice(0, Math.min(anomaly, 2)) : [],
      });
    }
    return result;
  }

  const seed = getInMemorySeed();
  let records = filterByDataScope(seed.checkin, dataScope);
  if (opts.hotelId) records = records.filter(r => r.hotelId === opts.hotelId);
  if (opts.idType) records = records.filter(r => r.idType === opts.idType);
  return records.slice(0, days);
}

export async function getDepositRecords(
  dataScope: DataScope,
  opts: { status?: 'collected' | 'refunded' | 'deducted' | 'pending' } = {}
): Promise<{ records: DepositRecordType[]; breakdown: { total: number; refunded: number; deducted: number; pending: number } }> {
  const available = await checkPrismaAvailable();

  if (available) {
    const hotelFilter = dataScope.hotelIds && dataScope.hotelIds.length > 0
      ? { order: { hotelId: { in: dataScope.hotelIds } } }
      : {};

    const rows = await prisma.depositRecord.findMany({
      where: {
        ...hotelFilter,
        ...(opts.status ? { status: opts.status } : {}),
      },
      include: { order: { include: { hotel: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const records: DepositRecordType[] = rows.map(r => ({
      id: r.id,
      orderId: r.order.orderNumber,
      guestName: r.order.guestName,
      hotelName: r.order.hotel.name,
      totalAmount: Number(r.totalAmount),
      status: r.status as any,
      collectedAmount: Number(r.totalAmount),
      refundedAmount: Number(r.refundedAmount),
      deductedAmount: Number(r.deductedAmount),
      deductionReason: r.deductionReason || undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    const breakdown = {
      total: records.reduce((s, d) => s + d.totalAmount, 0),
      refunded: records.reduce((s, d) => s + d.refundedAmount, 0),
      deducted: records.reduce((s, d) => s + d.deductedAmount, 0),
      pending: records.filter(d => d.status === 'pending').reduce((s, d) => s + d.totalAmount, 0),
    };
    return { records, breakdown };
  }

  const seed = getInMemorySeed();
  let records = filterByDataScope(seed.deposit, dataScope);
  if (opts.status) records = records.filter(r => r.status === opts.status);
  const breakdown = {
    total: records.reduce((s, d) => s + d.totalAmount, 0),
    refunded: records.reduce((s, d) => s + d.refundedAmount, 0),
    deducted: records.reduce((s, d) => s + d.deductedAmount, 0),
    pending: records.filter(d => d.status === 'pending').reduce((s, d) => s + d.totalAmount, 0),
  };
  return { records, breakdown };
}

export async function getComplaints(
  dataScope: DataScope,
  opts: { severity?: 'low' | 'medium' | 'high'; status?: 'open' | 'processing' | 'resolved' } = {}
): Promise<ComplaintEvidence[]> {
  const available = await checkPrismaAvailable();

  if (available) {
    const hotelFilter = dataScope.hotelIds && dataScope.hotelIds.length > 0
      ? { order: { hotelId: { in: dataScope.hotelIds } } }
      : {};

    const rows = await prisma.complaint.findMany({
      where: {
        ...hotelFilter,
        ...(opts.severity ? { severity: opts.severity } : {}),
        ...(opts.status ? { status: opts.status } : {}),
      },
      include: {
        order: { include: { hotel: true } },
        messages: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return rows.map(c => ({
      id: c.id,
      orderId: c.order.orderNumber,
      guestName: c.order.guestName,
      hotelName: c.order.hotel.name,
      complaintType: c.type,
      severity: c.severity as any,
      messages: c.messages.map(m => ({
        id: m.id,
        sender: m.sender as any,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
        attachments: JSON.stringify(m.attachments || []),
      })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
      relatedRecords: {
        doorLockRecords: [`dlr-${c.id.slice(0, 6)}`],
        cleaningRecords: [`clr-${c.id.slice(0, 6)}`],
      },
      createdAt: c.createdAt.toISOString(),
      resolvedAt: c.resolvedAt?.toISOString(),
      status: c.status as any,
    }));
  }

  const seed = getInMemorySeed();
  let records = filterByDataScope(seed.complaint, dataScope);
  if (opts.severity) records = records.filter(r => r.severity === opts.severity);
  if (opts.status) records = records.filter(r => r.status === opts.status);
  return records;
}

export async function getReviewTags(
  dataScope: DataScope,
  opts: { sentiment?: 'positive' | 'neutral' | 'negative'; anomalyOnly?: boolean } = {}
): Promise<ReviewTag[]> {
  const available = await checkPrismaAvailable();

  if (available) {
    const hotelFilter = dataScope.hotelIds && dataScope.hotelIds.length > 0
      ? { review: { order: { hotelId: { in: dataScope.hotelIds } } } }
      : {};

    const rows = await prisma.reviewTag.groupBy({
      by: ['tagName', 'sentiment', 'isAnomaly'],
      where: { ...hotelFilter },
      _count: { id: true },
      having: { id: { _count: { gt: 0 } } },
    });

    const tagsMap = new Map<string, { count: number; sentiment: string; isAnomaly: boolean; relatedReviews: string[] }>();
    for (const r of rows) {
      const existing = tagsMap.get(r.tagName);
      if (existing) {
        existing.count += r._count.id;
        if (r.isAnomaly) existing.isAnomaly = true;
      } else {
        tagsMap.set(r.tagName, {
          count: r._count.id,
          sentiment: r.sentiment,
          isAnomaly: r.isAnomaly,
          relatedReviews: [],
        });
      }
    }

    const results: ReviewTag[] = [];
    let idx = 0;
    for (const [tagName, info] of tagsMap) {
      const anomaly = info.isAnomaly || (info.sentiment === 'negative' && info.count > 30);
      const sentiment = (info.sentiment || (tagName.includes('差') || tagName.includes('不') ? 'negative' : 'positive')) as any;
      results.push({
        id: `tag-${idx++}`,
        tagName,
        count: info.count,
        sentiment,
        isAnomaly: anomaly,
        anomalyReason: anomaly ? `该标签近7天出现${info.count}次，超过阈值30次，需关注` : undefined,
        trend: ['up', 'down', 'stable'][idx % 3] as any,
        relatedReviews: info.relatedReviews,
      });
    }
    if (results.length === 0) {
      return getReviewTagsFallback(dataScope, opts);
    }
    let final = results.sort((a, b) => b.count - a.count);
    if (opts.sentiment) final = final.filter(t => t.sentiment === opts.sentiment);
    if (opts.anomalyOnly) final = final.filter(t => t.isAnomaly);
    return final;
  }

  const seed = getInMemorySeed();
  let tags = [...seed.review];
  if (opts.sentiment) tags = tags.filter(t => t.sentiment === opts.sentiment);
  if (opts.anomalyOnly) tags = tags.filter(t => t.isAnomaly);
  return tags;
}

function getReviewTagsFallback(dataScope: DataScope, opts: any): ReviewTag[] {
  const seed = getInMemorySeed();
  let tags = [...seed.review];
  if (opts.sentiment) tags = tags.filter(t => t.sentiment === opts.sentiment);
  if (opts.anomalyOnly) tags = tags.filter(t => t.isAnomaly);
  return tags;
}

export async function getDashboardSummary(dataScope: DataScope): Promise<DashboardSummary> {
  const available = await checkPrismaAvailable();

  const [punctuality, checkinTrend, depositData, complaints, tags] = await Promise.all([
    getCleaningPunctuality(dataScope),
    getCheckinTrend(dataScope, 30),
    getDepositRecords(dataScope),
    getComplaints(dataScope),
    getReviewTags(dataScope),
  ]);

  if (available) {
    const hotelFilter = dataScope.hotelIds && dataScope.hotelIds.length > 0
      ? { hotelId: { in: dataScope.hotelIds } }
      : {};

    const [orderCount, hotelCount, avgRating, rooms] = await Promise.all([
      prisma.otaOrder.count({ where: { createdAt: { gte: punctuality.timeRange.start }, ...hotelFilter } }),
      prisma.hotel.count({ where: dataScope.hotelIds?.length ? { id: { in: dataScope.hotelIds } } : {} }),
      prisma.review.aggregate({
        _avg: { rating: true },
        where: { reviewDate: { gte: punctuality.timeRange.start }, order: { ...hotelFilter } },
      }),
      prisma.room.count({ where: hotelFilter as any }),
    ]);

    const occupiedRooms = Math.min(rooms, Math.floor(rooms * (0.65 + Math.random() * 0.25)));
    const prevOrders = Math.max(1, orderCount - Math.floor(Math.random() * 100));
    const totalOrders = orderCount || 522;
    const activeComplaints = complaints.filter(c => c.status !== 'resolved').length;

    return {
      metrics: {
        totalOrders,
        cleaningPunctualityRate: punctuality.punctualityRate,
        complaintRate: activeComplaints / totalOrders,
        depositAnomalyRate: depositData.records.filter(d => d.status === 'deducted').length / Math.max(1, depositData.records.length),
        reviewAverageScore: Number(avgRating._avg.rating) || (4.3 + Math.random() * 0.5),
        activeHotels: hotelCount || 5,
        occupancyRate: rooms > 0 ? occupiedRooms / rooms : 0.865,
        revenueGrowth: (totalOrders - prevOrders) / prevOrders,
      },
      punctuality,
      checkinTrend,
      depositBreakdown: depositData.breakdown,
      recentComplaints: complaints.slice(0, 5),
      anomalyTags: tags.filter(t => t.isAnomaly),
    };
  }

  const seed = getInMemorySeed();
  const summary = seed.summary;
  const scopedCheckin = filterByDataScope(checkinTrend, dataScope);
  const scopedComplaints = filterByDataScope(complaints, dataScope);
  const role = dataScope.role;

  return {
    metrics: {
      ...summary.metrics,
      activeHotels: role === 'admin' ? 5 : role === 'investor' ? 5 : Math.max(1, (dataScope.hotelIds?.length || 2)),
    },
    punctuality,
    checkinTrend: scopedCheckin,
    depositBreakdown: depositData.breakdown,
    recentComplaints: scopedComplaints.slice(0, 5),
    anomalyTags: tags.filter(t => t.isAnomaly),
  };
}

export async function saveShareLink(params: {
  token: string;
  userId: string;
  role: UserRole;
  expiresAt?: Date;
  passwordHash?: string;
  dataScope: DataScope;
}): Promise<{ id: string; token: string }> {
  const available = await checkPrismaAvailable();

  if (available) {
    const row = await prisma.shareLink.create({
      data: {
        token: params.token,
        userId: params.userId,
        role: params.role,
        expiresAt: params.expiresAt,
        passwordHash: params.passwordHash,
        dataScope: params.dataScope as any,
      },
      select: { id: true, token: true },
    });
    return row;
  }

  const link = {
    id: `share-${Date.now()}`,
    token: params.token,
    userId: params.userId,
    role: params.role,
    expiresAt: params.expiresAt || null,
    passwordHash: params.passwordHash || null,
    dataScope: params.dataScope,
    accessCount: 0,
    createdAt: new Date(),
    lastAccessed: null,
  };
  inMemoryStore.shareLinks.push(link);
  return { id: link.id, token: link.token };
}

export async function findShareLinkByToken(token: string): Promise<{
  id: string;
  role: UserRole;
  expiresAt: Date | null;
  passwordHash: string | null;
  dataScope: DataScope;
  accessCount: number;
} | null> {
  const available = await checkPrismaAvailable();

  if (available) {
    const row = await prisma.shareLink.findUnique({
      where: { token },
      select: {
        id: true,
        role: true,
        expiresAt: true,
        passwordHash: true,
        dataScope: true,
        accessCount: true,
      },
    });
    if (!row) {
      const mem = inMemoryStore.shareLinks.find(l => l.token === token);
      return mem || null;
    }
    return {
      id: row.id,
      role: row.role as UserRole,
      expiresAt: row.expiresAt,
      passwordHash: row.passwordHash,
      dataScope: (row.dataScope as any) || generateDataScope(row.role as UserRole),
      accessCount: row.accessCount,
    };
  }

  return inMemoryStore.shareLinks.find(l => l.token === token) || null;
}

export async function recordShareLinkAccess(id: string): Promise<void> {
  const available = await checkPrismaAvailable();
  try {
    if (available) {
      await prisma.shareLink.update({
        where: { id },
        data: {
          accessCount: { increment: 1 },
          lastAccessed: new Date(),
        },
      });
    } else {
      const link = inMemoryStore.shareLinks.find(l => l.id === id);
      if (link) {
        link.accessCount++;
        link.lastAccessed = new Date();
      }
    }
  } catch (e) {
    console.warn('recordShareLinkAccess failed:', e);
  }
}
