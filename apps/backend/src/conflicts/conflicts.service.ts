import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictStatus, ConflictRiskLevel, UserRole } from '@prisma/client';

@Injectable()
export class ConflictsService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: any, params: {
    page?: number;
    pageSize?: number;
    propertyId?: number;
    status?: ConflictStatus;
    riskLevel?: ConflictRiskLevel;
    roomId?: number;
  }) {
    const { page = 1, pageSize = 10, propertyId, status, riskLevel, roomId } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;
    if (status) where.status = status;
    if (riskLevel) where.riskLevel = riskLevel;
    if (roomId) where.roomId = roomId;

    if (user.role === UserRole.FRONTLINE) {
      where.OR = [
        { createdById: user.userId },
        { handledById: user.userId },
      ];
    }

    const [conflicts, total] = await Promise.all([
      this.prisma.roomConflict.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [
          { riskLevel: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          property: { select: { name: true } },
          room: { select: { roomNumber: true, roomType: true } },
          order: { select: { orderNo: true, guestName: true } },
          createdBy: { select: { id: true, fullName: true } },
          handledBy: { select: { id: true, fullName: true } },
          _count: {
            select: { communications: true, reviewRecords: true },
          },
        },
      }),
      this.prisma.roomConflict.count({ where }),
    ]);

    const highRiskCount = await this.prisma.roomConflict.count({
      where: {
        ...where,
        riskLevel: { in: [ConflictRiskLevel.HIGH, ConflictRiskLevel.CRITICAL] },
        status: { in: [ConflictStatus.OPEN, ConflictStatus.IN_PROGRESS] },
      },
    });

    return {
      list: conflicts,
      total,
      page,
      pageSize,
      highRiskCount,
    };
  }

  async findOne(id: number) {
    const conflict = await this.prisma.roomConflict.findUnique({
      where: { id },
      include: {
        property: true,
        room: true,
        order: true,
        createdBy: { select: { id: true, fullName: true, role: true } },
        handledBy: { select: { id: true, fullName: true, role: true } },
        communications: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
          },
        },
        reviewRecords: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, fullName: true, role: true } },
          },
        },
      },
    });

    if (!conflict) {
      throw new NotFoundException('冲突记录不存在');
    }

    return conflict;
  }

  async create(data: any, userId: number) {
    const conflictNo = `CNF${Date.now()}`;

    return this.prisma.roomConflict.create({
      data: {
        ...data,
        conflictNo,
        createdById: userId,
      },
    });
  }

  async update(id: number, data: any, user: any) {
    const conflict = await this.prisma.roomConflict.findUnique({ where: { id } });
    if (!conflict) {
      throw new NotFoundException('冲突记录不存在');
    }

    if (user.role === UserRole.FRONTLINE && conflict.createdById !== user.userId) {
      throw new ForbiddenException('您无权修改此冲突记录');
    }

    return this.prisma.roomConflict.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: number, status: ConflictStatus, handledById: number, resolution?: string) {
    const conflict = await this.prisma.roomConflict.findUnique({ where: { id } });
    if (!conflict) {
      throw new NotFoundException('冲突记录不存在');
    }

    const data: any = { status, handledById };
    if (status === ConflictStatus.RESOLVED || status === ConflictStatus.CLOSED) {
      data.resolvedAt = new Date();
      if (resolution) data.resolution = resolution;
    }

    return this.prisma.roomConflict.update({
      where: { id },
      data,
    });
  }

  async addCommunication(conflictId: number, userId: number, message: string, attachments?: any) {
    const conflict = await this.prisma.roomConflict.findUnique({ where: { id: conflictId } });
    if (!conflict) {
      throw new NotFoundException('冲突记录不存在');
    }

    return this.prisma.communication.create({
      data: {
        conflictId,
        userId,
        message,
        attachments,
      },
      include: {
        user: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
      },
    });
  }

  async addReviewRecord(conflictId: number, userId: number, reviewType: string, opinion: string, isApproved?: boolean) {
    const conflict = await this.prisma.roomConflict.findUnique({ where: { id: conflictId } });
    if (!conflict) {
      throw new NotFoundException('冲突记录不存在');
    }

    return this.prisma.reviewRecord.create({
      data: {
        conflictId,
        userId,
        reviewType,
        opinion,
        isApproved,
      },
      include: {
        user: { select: { id: true, fullName: true, role: true } },
      },
    });
  }

  async getHighRiskConflicts(user: any, propertyId?: number) {
    const where: any = {
      riskLevel: { in: [ConflictRiskLevel.HIGH, ConflictRiskLevel.CRITICAL] },
      status: { in: [ConflictStatus.OPEN, ConflictStatus.IN_PROGRESS] },
    };
    if (propertyId) where.propertyId = propertyId;

    if (user.role === UserRole.FRONTLINE) {
      where.OR = [
        { createdById: user.userId },
        { handledById: user.userId },
      ];
    }

    return this.prisma.roomConflict.findMany({
      where,
      orderBy: [
        { riskLevel: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        property: { select: { name: true } },
        room: {
          select: {
            roomNumber: true,
            property: { select: { name: true } },
          },
        },
        order: { select: { orderNo: true, guestName: true } },
        createdBy: { select: { id: true, fullName: true, role: true } },
        communications: { select: { id: true } },
      },
      take: 10,
    });
  }

  async remove(id: number) {
    return this.prisma.roomConflict.delete({ where: { id } });
  }

  async getStatistics(user: any, propertyId?: number) {
    const where: any = {};
    if (propertyId) where.propertyId = propertyId;

    if (user.role === UserRole.FRONTLINE) {
      where.OR = [
        { createdById: user.userId },
        { handledById: user.userId },
      ];
    }

    const [total, open, inProgress, resolved, highRisk] = await Promise.all([
      this.prisma.roomConflict.count({ where }),
      this.prisma.roomConflict.count({ where: { ...where, status: ConflictStatus.OPEN } }),
      this.prisma.roomConflict.count({ where: { ...where, status: ConflictStatus.IN_PROGRESS } }),
      this.prisma.roomConflict.count({ where: { ...where, status: ConflictStatus.RESOLVED } }),
      this.prisma.roomConflict.count({
        where: {
          ...where,
          riskLevel: { in: [ConflictRiskLevel.HIGH, ConflictRiskLevel.CRITICAL] },
          status: { in: [ConflictStatus.OPEN, ConflictStatus.IN_PROGRESS] },
        },
      }),
    ]);

    return { total, open, inProgress, resolved, highRisk };
  }
}
