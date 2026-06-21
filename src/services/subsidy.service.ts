import { prisma } from "@/lib/prisma";
import { subDays, subMonths, startOfDay, endOfDay, startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";

export class SubsidyService {
  static async getSubsidyTrend(startDate: Date, endDate: Date, regionId?: string) {
    const subsidies = await prisma.subsidyRecord.findMany({
      where: {
        subsidyDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(regionId && { regionId }),
      },
      orderBy: { subsidyDate: "asc" },
      include: {
        region: true,
        rule: true,
      },
    });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    const dailyData = days.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const daySubsidies = subsidies.filter(
        (s) => s.subsidyDate >= dayStart && s.subsidyDate <= dayEnd
      );

      return {
        date: format(day, "yyyy-MM-dd"),
        totalAmount: daySubsidies.reduce((sum, s) => sum + Number(s.amount), 0),
        orderCount: daySubsidies.length,
        avgAmount: daySubsidies.length > 0 
          ? daySubsidies.reduce((sum, s) => sum + Number(s.amount), 0) / daySubsidies.length 
          : 0,
        baseAmount: daySubsidies.reduce((sum, s) => sum + Number(s.baseAmount), 0),
        distanceBonus: daySubsidies.reduce((sum, s) => sum + Number(s.distanceBonus), 0),
        timeBonus: daySubsidies.reduce((sum, s) => sum + Number(s.timeBonus), 0),
        otherBonus: daySubsidies.reduce((sum, s) => sum + Number(s.otherBonus), 0),
      };
    });

    return dailyData;
  }

  static async getSubsidyByRegion(startDate: Date, endDate: Date) {
    const subsidies = await prisma.subsidyRecord.findMany({
      where: {
        subsidyDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        region: true,
      },
    });

    const regionMap = new Map<string, {
      regionId: string;
      regionName: string;
      totalAmount: number;
      orderCount: number;
      avgAmount: number;
    }>();

    for (const subsidy of subsidies) {
      const existing = regionMap.get(subsidy.regionId) || {
        regionId: subsidy.regionId,
        regionName: subsidy.region.name,
        totalAmount: 0,
        orderCount: 0,
        avgAmount: 0,
      };
      existing.totalAmount += Number(subsidy.amount);
      existing.orderCount += 1;
      regionMap.set(subsidy.regionId, existing);
    }

    const result = Array.from(regionMap.values()).map((r) => ({
      ...r,
      avgAmount: r.orderCount > 0 ? r.totalAmount / r.orderCount : 0,
    }));

    return result.sort((a, b) => b.totalAmount - a.totalAmount);
  }

  static async getSubsidyByDispatchDuration(startDate: Date, endDate: Date) {
    const subsidies = await prisma.subsidyRecord.findMany({
      where: {
        subsidyDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        order: true,
      },
    });

    const durationBuckets = [
      { label: "0-5分钟", min: 0, max: 5, totalAmount: 0, count: 0 },
      { label: "5-10分钟", min: 5, max: 10, totalAmount: 0, count: 0 },
      { label: "10-15分钟", min: 10, max: 15, totalAmount: 0, count: 0 },
      { label: "15-30分钟", min: 15, max: 30, totalAmount: 0, count: 0 },
      { label: "30分钟以上", min: 30, max: Infinity, totalAmount: 0, count: 0 },
    ];

    for (const subsidy of subsidies) {
      const duration = subsidy.order.dispatchDuration || 0;
      const bucket = durationBuckets.find(
        (b) => duration >= b.min && duration < b.max
      );
      if (bucket) {
        bucket.totalAmount += Number(subsidy.amount);
        bucket.count += 1;
      }
    }

    return durationBuckets.map((b) => ({
      label: b.label,
      totalAmount: b.totalAmount,
      orderCount: b.count,
      avgAmount: b.count > 0 ? b.totalAmount / b.count : 0,
    }));
  }

  static async getYoYComparison(currentStart: Date, currentEnd: Date) {
    const lastYearStart = subMonths(currentStart, 12);
    const lastYearEnd = subMonths(currentEnd, 12);

    const [currentData, lastYearData] = await Promise.all([
      this.getSubsidyTrend(currentStart, currentEnd),
      this.getSubsidyTrend(lastYearStart, lastYearEnd),
    ]);

    const currentTotal = currentData.reduce((sum, d) => sum + d.totalAmount, 0);
    const lastYearTotal = lastYearData.reduce((sum, d) => sum + d.totalAmount, 0);

    const yoyRate = lastYearTotal > 0 ? ((currentTotal - lastYearTotal) / lastYearTotal) * 100 : 0;

    return {
      current: {
        totalAmount: currentTotal,
        orderCount: currentData.reduce((sum, d) => sum + d.orderCount, 0),
        avgAmount: currentData.length > 0 ? currentTotal / currentData.length : 0,
      },
      lastYear: {
        totalAmount: lastYearTotal,
        orderCount: lastYearData.reduce((sum, d) => sum + d.orderCount, 0),
        avgAmount: lastYearData.length > 0 ? lastYearTotal / lastYearData.length : 0,
      },
      yoyRate,
      dailyData: currentData,
    };
  }

  static async getMoMComparison(currentStart: Date, currentEnd: Date) {
    const lastMonthStart = subMonths(currentStart, 1);
    const lastMonthEnd = subMonths(currentEnd, 1);

    const [currentData, lastMonthData] = await Promise.all([
      this.getSubsidyTrend(currentStart, currentEnd),
      this.getSubsidyTrend(lastMonthStart, lastMonthEnd),
    ]);

    const currentTotal = currentData.reduce((sum, d) => sum + d.totalAmount, 0);
    const lastMonthTotal = lastMonthData.reduce((sum, d) => sum + d.totalAmount, 0);

    const momRate = lastMonthTotal > 0 ? ((currentTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

    return {
      current: {
        totalAmount: currentTotal,
        orderCount: currentData.reduce((sum, d) => sum + d.orderCount, 0),
        avgAmount: currentData.length > 0 ? currentTotal / currentData.length : 0,
      },
      lastMonth: {
        totalAmount: lastMonthTotal,
        orderCount: lastMonthData.reduce((sum, d) => sum + d.orderCount, 0),
        avgAmount: lastMonthData.length > 0 ? lastMonthTotal / lastMonthData.length : 0,
      },
      momRate,
    };
  }

  static async getSubsidyRules() {
    return prisma.subsidyRule.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  static async getAppealList(status?: string) {
    return prisma.appealEvidence.findMany({
      where: {
        ...(status && { status: status as any }),
      },
      include: {
        subsidy: {
          include: {
            order: true,
            region: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
      take: 50,
    });
  }
}
