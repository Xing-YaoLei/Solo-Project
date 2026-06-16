import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReplenishmentOrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const orders = await this.prisma.replenishmentOrder.findMany({
      include: {
        store: { select: { id: true, name: true, code: true } },
        insuranceRecords: true,
        prescriptionPhotos: true,
        followUpTasks: {
          include: {
            assignee: { select: { id: true, name: true, role: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return orders;
  }

  async findOne(id: string) {
    const order = await this.prisma.replenishmentOrder.findUnique({
      where: { id },
      include: {
        store: true,
        insuranceRecords: true,
        prescriptionPhotos: true,
        followUpTasks: {
          include: {
            assignee: { select: { id: true, name: true, role: true } },
            pharmacistOpinions: {
              include: {
                pharmacist: { select: { id: true, name: true } },
              },
            },
            batchExpiryRecords: true,
            reviewNotes: {
              include: {
                author: { select: { id: true, name: true, role: true } },
              },
            },
          },
        },
      },
    });
    return order;
  }

  async createFollowUpTask(orderId: string) {
    const order = await this.prisma.replenishmentOrder.findUnique({
      where: { id: orderId },
      include: {
        store: true,
        prescriptionPhotos: true,
      },
    });

    if (!order) {
      return null;
    }

    let riskLevel = 'LOW';
    if (order.prescriptionPhotos.length > 0) {
      const hasUnclear = order.prescriptionPhotos.some((photo) => !photo.isClear);
      if (hasUnclear) {
        riskLevel = 'HIGH';
      }
    } else {
      riskLevel = 'MEDIUM';
    }

    const assignee = await this.prisma.user.findFirst({
      where: {
        role: { in: ['CLERK', 'PHARMACIST'] },
        storeId: order.storeId,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!assignee) {
      const anyAssignee = await this.prisma.user.findFirst({
        where: { role: { in: ['CLERK', 'PHARMACIST'] } },
        orderBy: { createdAt: 'asc' },
      });

      if (!anyAssignee) {
        return null;
      }

      const taskCount = await this.prisma.followUpTask.count({
        where: { assigneeId: anyAssignee.id, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      });

      const taskNo = `FU-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const task = await this.prisma.followUpTask.create({
        data: {
          taskNo,
          replenishmentOrderId: orderId,
          drugName: order.drugName,
          storeId: order.storeId,
          storeName: order.store.name,
          assigneeId: anyAssignee.id,
          assigneeName: anyAssignee.name,
          status: 'PENDING',
          riskLevel,
        },
        include: {
          assignee: { select: { id: true, name: true, role: true } },
          replenishmentOrder: true,
        },
      });

      return task;
    }

    const taskNo = `FU-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const task = await this.prisma.followUpTask.create({
      data: {
        taskNo,
        replenishmentOrderId: orderId,
        drugName: order.drugName,
        storeId: order.storeId,
        storeName: order.store.name,
        assigneeId: assignee.id,
        assigneeName: assignee.name,
        status: 'PENDING',
        riskLevel,
      },
      include: {
        assignee: { select: { id: true, name: true, role: true } },
        replenishmentOrder: true,
      },
    });

    return task;
  }
}
