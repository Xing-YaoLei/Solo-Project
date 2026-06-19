import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogService } from '../system-log/system-log.service';

@Injectable()
export class SponsorService {
  constructor(
    private prisma: PrismaService,
    private systemLogService: SystemLogService,
  ) {}

  async findAll(params?: {
    scheduleId?: number;
    level?: string;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { scheduleId, level, status, search, page = 1, pageSize = 20 } = params || {};
    const where: any = {};

    if (scheduleId) where.scheduleId = scheduleId;
    if (level) where.level = level;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { contactName: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.sponsor.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { amount: 'desc' },
        include: {
          schedule: { select: { id: true, title: true, startTime: true } },
        },
      }),
      this.prisma.sponsor.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async findById(id: number) {
    return this.prisma.sponsor.findUnique({
      where: { id },
      include: { schedule: true },
    });
  }

  async create(data: {
    scheduleId: number;
    name: string;
    level: string;
    amount: number;
    contactName?: string;
    contactPhone?: string;
    benefits?: string;
    status?: string;
  }, operatorId?: number) {
    const sponsor = await this.prisma.sponsor.create({
      data: {
        ...data,
        amount: data.amount as any,
      },
      include: { schedule: true },
    });

    await this.systemLogService.create({
      action: 'CREATE',
      module: 'sponsor',
      description: `添加赞助商: ${sponsor.name}`,
      operatorId,
      relatedId: sponsor.id,
      relatedType: 'Sponsor',
    });

    return sponsor;
  }

  async update(id: number, data: any, operatorId?: number) {
    const sponsor = await this.prisma.sponsor.update({
      where: { id },
      data: data.amount ? { ...data, amount: data.amount as any } : data,
      include: { schedule: true },
    });

    await this.systemLogService.create({
      action: 'UPDATE',
      module: 'sponsor',
      description: `更新赞助商: ${sponsor.name}`,
      operatorId,
      relatedId: sponsor.id,
      relatedType: 'Sponsor',
    });

    return sponsor;
  }

  async remove(id: number, operatorId?: number) {
    const sponsor = await this.prisma.sponsor.delete({ where: { id } });

    await this.systemLogService.create({
      action: 'DELETE',
      module: 'sponsor',
      description: `删除赞助商: ${sponsor.name}`,
      operatorId,
      relatedId: id,
      relatedType: 'Sponsor',
    });

    return sponsor;
  }

  async getSponsorStats(scheduleId?: number) {
    const where: any = {};
    if (scheduleId) where.scheduleId = scheduleId;

    const sponsors = await this.prisma.sponsor.findMany({ where });
    const totalAmount = sponsors.reduce((sum, s) => sum + Number(s.amount), 0);
    
    const levelStats: any = {};
    for (const s of sponsors) {
      if (!levelStats[s.level]) {
        levelStats[s.level] = { count: 0, amount: 0 };
      }
      levelStats[s.level].count++;
      levelStats[s.level].amount += Number(s.amount);
    }

    return {
      totalCount: sponsors.length,
      totalAmount,
      levelStats,
    };
  }
}
