import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface StatusChangeInput {
  entityType: string;
  entityId: string;
  fromStatus?: string | null;
  toStatus: string;
  changedBy?: string | null;
  changeReason?: string | null;
  changeNote?: string | null;
  activityId?: string | null;
  orderId?: string | null;
  ticketTypeId?: string | null;
  metadata?: Record<string, any> | null;
}

@Injectable()
export class StatusHistoryService {
  constructor(private prisma: PrismaService) {}

  async record(input: StatusChangeInput) {
    return this.prisma.statusHistory.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        fromStatus: input.fromStatus || null,
        toStatus: input.toStatus,
        changedBy: input.changedBy || null,
        changeReason: input.changeReason || null,
        changeNote: input.changeNote || null,
        activityId: input.activityId || null,
        orderId: input.orderId || null,
        ticketTypeId: input.ticketTypeId || null,
        metadata: input.metadata || null,
      },
    });
  }

  async query(entityType: string, entityId: string) {
    return this.prisma.statusHistory.findMany({
      where: { entityType, entityId },
      orderBy: { changedAt: 'asc' },
    });
  }

  async queryByActivity(activityId: string, entityType?: string) {
    return this.prisma.statusHistory.findMany({
      where: entityType ? { activityId, entityType } : { activityId },
      orderBy: { changedAt: 'desc' },
    });
  }
}
