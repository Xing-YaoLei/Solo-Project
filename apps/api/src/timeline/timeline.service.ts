import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimelineEventType, TimelineEventDTO } from '@legal/shared';

@Injectable()
export class TimelineService {
  constructor(private prisma: PrismaService) {}

  async addEvent(event: {
    caseId: string;
    eventType: TimelineEventType;
    title: string;
    content: string;
    operatorId: string;
    operatorName: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.timelineEvent.create({
      data: {
        caseId: event.caseId,
        eventType: event.eventType,
        title: event.title,
        content: event.content,
        operatorId: event.operatorId,
        operatorName: event.operatorName,
        metadata: event.metadata ? (event.metadata as any) : undefined,
      },
    });
  }

  async findByCaseId(caseId: string, page = 1, limit = 50) {
    const caseData = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caseData) {
      throw new NotFoundException(`Case ${caseId} not found`);
    }

    const [items, total] = await Promise.all([
      this.prisma.timelineEvent.findMany({
        where: { caseId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.timelineEvent.count({ where: { caseId } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(caseId: string, eventId: string) {
    const event = await this.prisma.timelineEvent.findFirst({
      where: { id: eventId, caseId },
    });
    if (!event) {
      throw new NotFoundException(`Timeline event ${eventId} not found in case ${caseId}`);
    }
    return event;
  }
}
