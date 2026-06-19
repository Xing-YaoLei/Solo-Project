import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogService } from '../system-log/system-log.service';

@Injectable()
export class TicketService {
  constructor(
    private prisma: PrismaService,
    private systemLogService: SystemLogService,
  ) {}

  async findAll(params?: {
    scheduleId?: number;
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { scheduleId, status, page = 1, pageSize = 20 } = params || {};
    const where: any = {};

    if (scheduleId) where.scheduleId = scheduleId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.ticketType.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { price: 'asc' },
        include: {
          schedule: { select: { id: true, title: true, startTime: true } },
        },
      }),
      this.prisma.ticketType.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async findById(id: number) {
    return this.prisma.ticketType.findUnique({
      where: { id },
      include: { schedule: true },
    });
  }

  async create(data: {
    scheduleId: number;
    name: string;
    price: number;
    totalCount: number;
    soldCount?: number;
    description?: string;
    rules?: string;
    status?: string;
  }, operatorId?: number) {
    const ticketType = await this.prisma.ticketType.create({
      data: {
        ...data,
        price: data.price as any,
      },
      include: { schedule: true },
    });

    await this.systemLogService.create({
      action: 'CREATE',
      module: 'ticket',
      description: `创建票种: ${ticketType.name}`,
      operatorId,
      relatedId: ticketType.id,
      relatedType: 'TicketType',
    });

    return ticketType;
  }

  async update(id: number, data: any, operatorId?: number) {
    const ticketType = await this.prisma.ticketType.update({
      where: { id },
      data: data.price ? { ...data, price: data.price as any } : data,
      include: { schedule: true },
    });

    await this.systemLogService.create({
      action: 'UPDATE',
      module: 'ticket',
      description: `更新票种: ${ticketType.name}`,
      operatorId,
      relatedId: ticketType.id,
      relatedType: 'TicketType',
    });

    return ticketType;
  }

  async remove(id: number, operatorId?: number) {
    const ticketType = await this.prisma.ticketType.delete({ where: { id } });

    await this.systemLogService.create({
      action: 'DELETE',
      module: 'ticket',
      description: `删除票种: ${ticketType.name}`,
      operatorId,
      relatedId: id,
      relatedType: 'TicketType',
    });

    return ticketType;
  }

  async getTicketStats(scheduleId?: number) {
    const where: any = {};
    if (scheduleId) where.scheduleId = scheduleId;

    const tickets = await this.prisma.ticketType.findMany({ where });
    
    let totalTickets = 0;
    let soldTickets = 0;
    let totalRevenue = 0;

    for (const t of tickets) {
      totalTickets += t.totalCount;
      soldTickets += t.soldCount;
      totalRevenue += t.soldCount * Number(t.price);
    }

    return {
      totalTickets,
      soldTickets,
      remainingTickets: totalTickets - soldTickets,
      sellRate: totalTickets > 0 ? (soldTickets / totalTickets * 100).toFixed(2) : '0',
      totalRevenue,
    };
  }
}
