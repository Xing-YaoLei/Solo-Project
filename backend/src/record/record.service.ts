import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SponsorService } from '../sponsor/sponsor.service';
import { VerificationService } from '../verification/verification.service';
import { TicketService } from '../ticket/ticket.service';

@Injectable()
export class RecordService {
  constructor(
    private prisma: PrismaService,
    private sponsorService: SponsorService,
    private verificationService: VerificationService,
    private ticketService: TicketService,
  ) {}

  async getRecordsBySchedule(scheduleId: number) {
    const [schedule, sponsors, verifications, ticketTypes, ticketStats, sponsorStats] = await Promise.all([
      this.prisma.performanceSchedule.findUnique({
        where: { id: scheduleId },
      }),
      this.prisma.sponsor.findMany({
        where: { scheduleId },
        orderBy: { amount: 'desc' },
      }),
      this.prisma.verificationRecord.findMany({
        where: { order: { scheduleId } },
        orderBy: { verifyTime: 'desc' },
        take: 50,
        include: {
          order: {
            include: {
              ticketType: { select: { id: true, name: true } },
            },
          },
          verifier: { select: { id: true, name: true } },
        },
      }),
      this.prisma.ticketType.findMany({
        where: { scheduleId },
        orderBy: { price: 'asc' },
      }),
      this.ticketService.getTicketStats(scheduleId),
      this.sponsorService.getSponsorStats(scheduleId),
    ]);

    const verificationStats = await this.verificationService.getVerificationStats({ scheduleId });

    return {
      schedule,
      sponsors: {
        list: sponsors,
        stats: sponsorStats,
      },
      verifications: {
        list: verifications,
        stats: verificationStats,
      },
      ticketTypes: {
        list: ticketTypes,
        stats: ticketStats,
      },
    };
  }

  async getRecordOverview(params?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    const { startDate, endDate } = params || {};

    const where: any = {};
    if (startDate) where.startTime = { gte: startDate };
    if (endDate) {
      if (where.startTime) {
        where.startTime.lte = endDate;
      } else {
        where.startTime = { lte: endDate };
      }
    }

    const schedules = await this.prisma.performanceSchedule.findMany({
      where,
      include: {
        _count: { select: { sponsors: true, orders: true, tasks: true } },
        sponsors: true,
        ticketTypes: true,
      },
      orderBy: { startTime: 'asc' },
    });

    let totalRevenue = 0;
    let totalTickets = 0;
    let totalSponsors = 0;
    let totalSponsorAmount = 0;

    for (const schedule of schedules) {
      for (const ticket of schedule.ticketTypes) {
        totalRevenue += ticket.soldCount * Number(ticket.price);
        totalTickets += ticket.soldCount;
      }
      for (const sponsor of schedule.sponsors) {
        totalSponsorAmount += Number(sponsor.amount);
      }
      totalSponsors += schedule._count.sponsors;
    }

    return {
      scheduleCount: schedules.length,
      totalRevenue,
      totalTickets,
      totalSponsors,
      totalSponsorAmount,
      schedules,
    };
  }
}
