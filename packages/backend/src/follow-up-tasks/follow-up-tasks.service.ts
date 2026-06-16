import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowUpTasksService {
  constructor(private prisma: PrismaService) {}

  private transformTask(task: any) {
    const order = task.replenishmentOrder;
    return {
      id: task.id,
      taskNo: task.taskNo,
      replenishmentOrderId: task.replenishmentOrderId,
      orderNo: order?.orderNo || '',
      drugName: task.drugName,
      assigneeId: task.assigneeId,
      assigneeName: task.assigneeName,
      status: task.status,
      riskLevel: task.riskLevel,
      storeId: task.storeId,
      storeName: task.storeName,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      completedAt: task.completedAt,
      hasInsuranceRecord: order?.insuranceRecords?.length > 0,
      hasPrescriptionPhoto: order?.prescriptionPhotos?.length > 0,
      hasPharmacistOpinion: task.pharmacistOpinions?.length > 0,
      hasBatchExpiry: task.batchExpiryRecords?.length > 0,
    };
  }

  async findAll(params: { status?: string; riskLevel?: string }) {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.riskLevel) where.riskLevel = params.riskLevel;

    const tasks = await this.prisma.followUpTask.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, role: true } },
        replenishmentOrder: {
          select: {
            id: true,
            orderNo: true,
            drugName: true,
            insuranceRecords: { select: { id: true } },
            prescriptionPhotos: { select: { id: true } },
          },
        },
        pharmacistOpinions: { select: { id: true } },
        batchExpiryRecords: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tasks.map((t) => this.transformTask(t));
  }

  async findMyTasks(userId: string, params: { status?: string; riskLevel?: string }) {
    const where: any = { assigneeId: userId };
    if (params.status) where.status = params.status;
    if (params.riskLevel) where.riskLevel = params.riskLevel;

    const tasks = await this.prisma.followUpTask.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, role: true } },
        replenishmentOrder: {
          select: {
            id: true,
            orderNo: true,
            drugName: true,
            insuranceRecords: { select: { id: true } },
            prescriptionPhotos: { select: { id: true } },
          },
        },
        pharmacistOpinions: { select: { id: true } },
        batchExpiryRecords: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tasks.map((t) => this.transformTask(t));
  }

  async findOne(id: string) {
    const task = await this.prisma.followUpTask.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, role: true } },
        replenishmentOrder: {
          include: {
            insuranceRecords: true,
            prescriptionPhotos: true,
          },
        },
        pharmacistOpinions: {
          include: {
            pharmacist: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        batchExpiryRecords: { orderBy: { createdAt: 'desc' } },
        reviewNotes: {
          include: {
            author: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) return null;

    const order = task.replenishmentOrder;
    return {
      id: task.id,
      taskNo: task.taskNo,
      replenishmentOrderId: task.replenishmentOrderId,
      orderNo: order?.orderNo || '',
      drugName: task.drugName,
      assigneeId: task.assigneeId,
      assigneeName: task.assigneeName,
      status: task.status,
      riskLevel: task.riskLevel,
      storeId: task.storeId,
      storeName: task.storeName,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      completedAt: task.completedAt,
      hasInsuranceRecord: order?.insuranceRecords?.length > 0,
      hasPrescriptionPhoto: order?.prescriptionPhotos?.length > 0,
      hasPharmacistOpinion: task.pharmacistOpinions?.length > 0,
      hasBatchExpiry: task.batchExpiryRecords?.length > 0,
      insuranceRecord: order?.insuranceRecords?.[0] || null,
      prescriptionPhoto: order?.prescriptionPhotos?.[0] || null,
      pharmacistOpinion: task.pharmacistOpinions?.[0] || null,
      batchExpiry: task.batchExpiryRecords?.[0] || null,
      reviewNotes: task.reviewNotes || [],
    };
  }

  async updateStatus(id: string, status: string) {
    const data: any = { status };
    if (status === 'COMPLETED') {
      data.completedAt = new Date();
    }
    return this.prisma.followUpTask.update({
      where: { id },
      data,
    });
  }

  async addReviewNote(id: string, data: { authorId: string; authorName: string; authorRole: string; type: string; content: string }) {
    return this.prisma.reviewNote.create({
      data: {
        followUpTaskId: id,
        authorId: data.authorId,
        authorName: data.authorName,
        authorRole: data.authorRole,
        type: data.type,
        content: data.content,
      },
    });
  }

  async submitPharmacistOpinion(id: string, data: { pharmacistId: string; pharmacistName: string; opinion: string; isApproved: boolean }) {
    return this.prisma.pharmacistOpinion.create({
      data: {
        followUpTaskId: id,
        pharmacistId: data.pharmacistId,
        pharmacistName: data.pharmacistName,
        opinion: data.opinion,
        isApproved: data.isApproved,
      },
    });
  }

  async submitBatchExpiry(id: string, data: { batchNo: string; productionDate: string; expiryDate: string; shelfLife: string; verifiedBy: string }) {
    return this.prisma.batchExpiryRecord.create({
      data: {
        followUpTaskId: id,
        batchNo: data.batchNo,
        productionDate: new Date(data.productionDate),
        expiryDate: new Date(data.expiryDate),
        shelfLife: data.shelfLife,
        verifiedBy: data.verifiedBy,
      },
    });
  }
}
