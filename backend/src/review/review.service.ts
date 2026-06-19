import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogService } from '../system-log/system-log.service';

@Injectable()
export class ReviewService {
  constructor(
    private prisma: PrismaService,
    private systemLogService: SystemLogService,
  ) {}

  async getMonthlyReview(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const schedules = await this.prisma.performanceSchedule.findMany({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        ticketTypes: true,
        sponsors: true,
        _count: { select: { tasks: true, orders: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    const verifications = await this.prisma.verificationRecord.findMany({
      where: {
        verifyTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        order: {
          include: {
            schedule: { select: { id: true, title: true } },
            ticketType: { select: { id: true, name: true, price: true } },
          },
        },
        verifier: { select: { id: true, name: true } },
      },
      orderBy: { verifyTime: 'asc' },
    });

    const scheduleReviews = [];
    let totalTickets = 0;
    let totalSold = 0;
    let totalVerified = 0;
    let totalRevenue = 0;
    let totalSponsorAmount = 0;

    for (const schedule of schedules) {
      const scheduleVerifications = verifications.filter(v => v.order.scheduleId === schedule.id);
      const scheduleVerifiedTickets = scheduleVerifications.reduce((sum, v) => sum + v.quantity, 0);
      const scheduleSoldTickets = schedule.ticketTypes.reduce((sum, t) => sum + t.soldCount, 0);
      const scheduleTotalTickets = schedule.ticketTypes.reduce((sum, t) => sum + t.totalCount, 0);
      const scheduleRevenue = scheduleVerifications.reduce((sum, v) => sum + v.quantity * Number(v.order.ticketType.price), 0);
      const scheduleSponsorAmount = schedule.sponsors.reduce((sum, s) => sum + Number(s.amount), 0);

      totalTickets += scheduleTotalTickets;
      totalSold += scheduleSoldTickets;
      totalVerified += scheduleVerifiedTickets;
      totalRevenue += scheduleRevenue;
      totalSponsorAmount += scheduleSponsorAmount;

      const verifyRate = scheduleSoldTickets > 0 ? (scheduleVerifiedTickets / scheduleSoldTickets) * 100 : 0;
      const sellRate = scheduleTotalTickets > 0 ? (scheduleSoldTickets / scheduleTotalTickets) * 100 : 0;

      const hourlyData = this.calculateHourlyVerification(scheduleVerifications, schedule.startTime);

      scheduleReviews.push({
        id: schedule.id,
        title: schedule.title,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        venue: schedule.venue,
        totalTickets: scheduleTotalTickets,
        soldTickets: scheduleSoldTickets,
        verifiedTickets: scheduleVerifiedTickets,
        sellRate: sellRate.toFixed(2),
        verifyRate: verifyRate.toFixed(2),
        revenue: scheduleRevenue,
        sponsorAmount: scheduleSponsorAmount,
        orderCount: schedule._count.orders,
        taskCount: schedule._count.tasks,
        verificationCount: scheduleVerifications.length,
        hourlyData,
        ticketTypes: schedule.ticketTypes.map(t => ({
          id: t.id,
          name: t.name,
          price: t.price,
          totalCount: t.totalCount,
          soldCount: t.soldCount,
          verifiedCount: scheduleVerifications.filter(v => v.order.ticketTypeId === t.id).reduce((sum, v) => sum + v.quantity, 0),
        })),
      });
    }

    const overallVerifyRate = totalSold > 0 ? ((totalVerified / totalSold) * 100).toFixed(2) : '0';
    const overallSellRate = totalTickets > 0 ? ((totalSold / totalTickets) * 100).toFixed(2) : '0';

    const dailyData = this.calculateDailyVerification(verifications, startDate, endDate);

    const verifierStats = this.calculateVerifierStats(verifications);

    return {
      year,
      month,
      summary: {
        scheduleCount: schedules.length,
        totalTickets,
        totalSold,
        totalVerified,
        totalRevenue,
        totalSponsorAmount,
        sellRate: overallSellRate,
        verifyRate: overallVerifyRate,
        verificationCount: verifications.length,
      },
      scheduleReviews,
      dailyData,
      verifierStats,
    };
  }

  private calculateHourlyVerification(verifications: any[], startTime: Date) {
    const hourlyData: { hour: string; count: number; tickets: number }[] = [];
    const startHour = startTime.getHours();
    
    for (let i = -2; i <= 5; i++) {
      const hour = startHour + i;
      const displayHour = hour < 0 ? 24 + hour : hour;
      hourlyData.push({
        hour: `${displayHour}:00`,
        count: 0,
        tickets: 0,
      });
    }

    for (const v of verifications) {
      const verifyHour = new Date(v.verifyTime).getHours();
      const hourDiff = verifyHour - startHour;
      const index = hourDiff + 2;
      if (index >= 0 && index < hourlyData.length) {
        hourlyData[index].count++;
        hourlyData[index].tickets += v.quantity;
      }
    }

    return hourlyData;
  }

  private calculateDailyVerification(verifications: any[], startDate: Date, endDate: Date) {
    const dailyData: { date: string; count: number; tickets: number; revenue: number }[] = [];
    const daysInMonth = endDate.getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      dailyData.push({
        date: `${i}日`,
        count: 0,
        tickets: 0,
        revenue: 0,
      });
    }

    for (const v of verifications) {
      const day = new Date(v.verifyTime).getDate();
      const index = day - 1;
      if (index >= 0 && index < dailyData.length) {
        dailyData[index].count++;
        dailyData[index].tickets += v.quantity;
        dailyData[index].revenue += v.quantity * Number(v.order.ticketType.price);
      }
    }

    return dailyData;
  }

  private calculateVerifierStats(verifications: any[]) {
    const verifierMap = new Map<number, { id: number; name: string; count: number; tickets: number }>();

    for (const v of verifications) {
      if (!verifierMap.has(v.verifierId)) {
        verifierMap.set(v.verifierId, {
          id: v.verifierId,
          name: v.verifier.name,
          count: 0,
          tickets: 0,
        });
      }
      const stats = verifierMap.get(v.verifierId)!;
      stats.count++;
      stats.tickets += v.quantity;
    }

    return Array.from(verifierMap.values()).sort((a, b) => b.tickets - a.tickets);
  }

  async getReviewTrend(months: number = 6) {
    const trends = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const review = await this.getMonthlyReview(year, month);
      
      trends.push({
        year,
        month,
        scheduleCount: review.summary.scheduleCount,
        totalSold: review.summary.totalSold,
        totalVerified: review.summary.totalVerified,
        totalRevenue: review.summary.totalRevenue,
        verifyRate: review.summary.verifyRate,
        sellRate: review.summary.sellRate,
      });
    }

    return trends;
  }
}
