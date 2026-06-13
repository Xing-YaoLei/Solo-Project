import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimelineAction, RefundStatus } from '@prisma/client';

@Injectable()
export class TimelineService {
  constructor(private prisma: PrismaService) {}

  async record(params: {
    refundOrderId: string;
    action: TimelineAction;
    oldStatus?: RefundStatus;
    newStatus?: RefundStatus;
    oldValue?: string;
    newValue?: string;
    note?: string;
    operatorId?: string;
  }) {
    return this.prisma.refundTimeline.create({
      data: {
        refundOrderId: params.refundOrderId,
        action: params.action,
        oldStatus: params.oldStatus,
        newStatus: params.newStatus,
        oldValue: params.oldValue,
        newValue: params.newValue,
        note: params.note,
        operatorId: params.operatorId,
      },
    });
  }

  async findByOrderId(refundOrderId: string) {
    return this.prisma.refundTimeline.findMany({
      where: { refundOrderId },
      include: { operator: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(params: {
    refundOrderId?: string;
    action?: TimelineAction;
    operatorId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const { page = 1, pageSize = 20, ...filters } = params;
    const where: any = {};

    if (filters.refundOrderId) where.refundOrderId = filters.refundOrderId;
    if (filters.action) where.action = filters.action;
    if (filters.operatorId) where.operatorId = filters.operatorId;
    if (filters.startDate) where.createdAt = { ...where.createdAt, gte: filters.startDate };
    if (filters.endDate) where.createdAt = { ...where.createdAt, lte: filters.endDate };

    const [total, items] = await Promise.all([
      this.prisma.refundTimeline.count({ where }),
      this.prisma.refundTimeline.findMany({
        where,
        include: {
          operator: { select: { id: true, name: true, role: true } },
          refundOrder: { select: { id: true, orderNo: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, page, pageSize, items };
  }
}
