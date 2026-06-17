import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto, CheckInDto, BulkCheckInDto } from './dto/activity.dto';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async findAll(date?: string) {
    const where: Record<string, unknown> = {};
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.activityDate = { gte: start, lt: end };
    }
    return this.prisma.activityCheckIn.findMany({
      where,
      include: { elder: { select: { id: true, name: true } } },
      orderBy: { activityDate: 'desc' },
    });
  }

  async create(dto: CreateActivityDto) {
    return this.prisma.activityCheckIn.create({
      data: {
        elderId: dto.elderId,
        activityName: dto.activityName,
        activityDate: new Date(dto.activityDate),
      },
    });
  }

  async checkIn(dto: CheckInDto) {
    return this.prisma.activityCheckIn.update({
      where: { id: dto.id },
      data: {
        checkedIn: dto.checkedIn,
        checkInTime: dto.checkedIn ? new Date() : null,
      },
    });
  }

  async bulkCheckIn(dto: BulkCheckInDto) {
    const results = [];
    for (const item of dto.items) {
      const result = await this.prisma.activityCheckIn.update({
        where: { id: item.id },
        data: {
          checkedIn: item.checkedIn,
          checkInTime: item.checkedIn ? new Date() : null,
        },
      });
      results.push(result);
    }
    return results;
  }

  async bulkCheckInByIds(ids: string[]) {
    const results = [];
    for (const id of ids) {
      const result = await this.prisma.activityCheckIn.update({
        where: { id },
        data: {
          checkedIn: true,
          checkInTime: new Date(),
        },
      });
      results.push(result);
    }
    return results;
  }
}
