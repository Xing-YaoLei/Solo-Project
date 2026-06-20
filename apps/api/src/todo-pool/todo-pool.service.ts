import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ComplaintStatus } from '@prisma/client';

@Injectable()
export class TodoPoolService {
  constructor(private prisma: PrismaService) {}

  async getOverdue(user: any) {
    const now = new Date();
    const where: any = {
      deadlineAt: { lt: now },
      status: { notIn: [ComplaintStatus.CLOSED, ComplaintStatus.OVERDUE] },
    };

    if (user.role === 'PATROL_STAFF' || user.role === 'TICKET_STAFF') {
      where.ownerId = user.id;
    } else if (user.role === 'OPERATOR') {
      where.departmentId = user.departmentId;
    }

    return this.prisma.complaint.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true } },
        department: true,
        tags: true,
      },
      orderBy: [{ deadlineAt: 'asc' }],
    });
  }

  async getSupplement(user: any) {
    const where: any = {
      status: ComplaintStatus.SUPPLEMENTING,
    };

    if (user.role === 'PATROL_STAFF' || user.role === 'TICKET_STAFF') {
      where.ownerId = user.id;
    } else if (user.role === 'OPERATOR') {
      where.departmentId = user.departmentId;
    }

    return this.prisma.complaint.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true } },
        department: true,
        tags: true,
      },
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  async getRejected(user: any) {
    const where: any = {
      status: ComplaintStatus.REJECTED,
    };

    if (user.role === 'PATROL_STAFF' || user.role === 'TICKET_STAFF') {
      where.ownerId = user.id;
    } else if (user.role === 'OPERATOR') {
      where.departmentId = user.departmentId;
    }

    return this.prisma.complaint.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true } },
        department: true,
        tags: true,
        operationLogs: {
          where: { action: 'REJECT' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
    });
  }
}
