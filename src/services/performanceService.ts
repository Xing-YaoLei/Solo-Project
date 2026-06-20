import { prisma } from "@/lib/prisma";
import { endOfDay, startOfDay } from "date-fns";

export interface PerformanceListQuery {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface PerformanceDetail {
  id: string;
  name: string;
  venue: string;
  startTime: string;
  endTime: string;
  totalSeats: number;
  soldSeats: number;
  status: string;
  seats: SeatDetail[];
  cancelInfo?: {
    id: string;
    cancelTime: string;
    reason: string;
    affectedCount: number;
  };
}

export interface SeatDetail {
  id: string;
  row: string;
  number: string;
  status: string;
  price: number;
  orderId?: string;
}

export async function getPerformanceList(query: PerformanceListQuery) {
  const {
    startDate,
    endDate,
    status,
    page = 1,
    pageSize = 20,
  } = query;

  const where: any = {};

  if (startDate || endDate) {
    where.startTime = {};
    if (startDate) where.startTime.gte = startOfDay(startDate);
    if (endDate) where.startTime.lte = endOfDay(endDate);
  }
  if (status) where.status = status;

  const [total, performances] = await Promise.all([
    prisma.performance.count({ where }),
    prisma.performance.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { startTime: "asc" },
      include: {
        _count: { select: { seats: true, cancels: true } },
        cancels: { take: 1 },
      },
    }),
  ]);

  const perfIds = performances.map((p) => p.id);
  const soldCountsRaw = await prisma.seat.groupBy({
    by: ["performanceId"],
    where: { performanceId: { in: perfIds }, status: "sold" },
    _count: { performanceId: true },
  });
  const soldMap = new Map<string, number>();
  soldCountsRaw.forEach((r) => soldMap.set(r.performanceId, r._count.performanceId));

  const list = performances.map((p) => ({
    id: p.id,
    name: p.name,
    venue: p.venue,
    startTime: p.startTime.toISOString(),
    endTime: p.endTime.toISOString(),
    totalSeats: p.totalSeats,
    soldSeats: soldMap.get(p.id) ?? 0,
    status: p.status,
    hasCancel: p._count.cancels > 0,
    cancelInfo: p.cancels.length > 0
      ? {
          id: p.cancels[0].id,
          cancelTime: p.cancels[0].cancelTime.toISOString(),
          reason: p.cancels[0].reason,
          affectedCount: p.cancels[0].affectedCount,
        }
      : null,
  }));

  return { total, list, page, pageSize };
}

export async function getPerformanceDetail(
  performanceId: string
): Promise<PerformanceDetail | null> {
  const performance = await prisma.performance.findUnique({
    where: { id: performanceId },
    include: {
      seats: { orderBy: [{ row: "asc" }, { number: "asc" }] },
      cancels: { orderBy: { cancelTime: "desc" }, take: 1 },
    },
  });

  if (!performance) return null;

  const soldSeats = performance.seats.filter((s) => s.status === "sold").length;

  return {
    id: performance.id,
    name: performance.name,
    venue: performance.venue,
    startTime: performance.startTime.toISOString(),
    endTime: performance.endTime.toISOString(),
    totalSeats: performance.totalSeats,
    soldSeats,
    status: performance.status,
    seats: performance.seats.map((s) => ({
      id: s.id,
      row: s.row,
      number: s.number,
      status: s.status,
      price: Number(s.price),
      orderId: s.orderId || undefined,
    })),
    cancelInfo: performance.cancels[0]
      ? {
          id: performance.cancels[0].id,
          cancelTime: performance.cancels[0].cancelTime.toISOString(),
          reason: performance.cancels[0].reason,
          affectedCount: performance.cancels[0].affectedCount,
        }
      : undefined,
  };
}

export async function getCancelEvents(startDate: Date, endDate: Date) {
  const cancels = await prisma.performanceCancel.findMany({
    where: {
      cancelTime: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
    },
    include: { performance: true },
    orderBy: { cancelTime: "desc" },
  });

  return cancels.map((c) => ({
    id: c.id,
    performanceId: c.performanceId,
    performanceName: c.performance.name,
    cancelTime: c.cancelTime.toISOString(),
    reason: c.reason,
    affectedCount: c.affectedCount,
  }));
}
