import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CleaningStatus, UserRole } from '@prisma/client';

@Injectable()
export class CleaningService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: any, params: {
    page?: number;
    pageSize?: number;
    propertyId?: number;
    status?: CleaningStatus;
    assignedToId?: number;
    date?: string;
  }) {
    const { page = 1, pageSize = 10, propertyId, status, assignedToId, date } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;
    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;
    
    if (user.role === UserRole.FRONTLINE) {
      where.assignedToId = user.userId;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.scheduledAt = { gte: startOfDay, lte: endOfDay };
    }

    const [tasks, total] = await Promise.all([
      this.prisma.cleaningTask.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [
          { priority: 'desc' },
          { scheduledAt: 'asc' },
        ],
        include: {
          property: { select: { name: true } },
          room: { select: { roomNumber: true, roomType: true } },
          order: { select: { orderNo: true, guestName: true } },
          assignedTo: { select: { id: true, fullName: true } },
        },
      }),
      this.prisma.cleaningTask.count({ where }),
    ]);

    return { list: tasks, total, page, pageSize };
  }

  async findOne(id: number) {
    const task = await this.prisma.cleaningTask.findUnique({
      where: { id },
      include: {
        property: true,
        room: true,
        order: true,
        assignedTo: { select: { id: true, fullName: true, phone: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });

    if (!task) {
      throw new NotFoundException('保洁任务不存在');
    }

    return task;
  }

  async create(data: any, userId: number) {
    const taskNo = `CLN${Date.now()}`;

    return this.prisma.cleaningTask.create({
      data: {
        ...data,
        taskNo,
        createdById: userId,
      },
    });
  }

  async update(id: number, data: any, user: any) {
    const task = await this.prisma.cleaningTask.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException('保洁任务不存在');
    }

    if (user.role === UserRole.FRONTLINE && task.assignedToId !== user.userId) {
      throw new ForbiddenException('您无权修改此任务');
    }

    return this.prisma.cleaningTask.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: number, status: CleaningStatus, user: any, inspectionNotes?: string) {
    const task = await this.prisma.cleaningTask.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException('保洁任务不存在');
    }

    if (user.role === UserRole.FRONTLINE && task.assignedToId !== user.userId) {
      throw new ForbiddenException('您无权修改此任务状态');
    }

    const updateData: any = { status };
    
    if (status === CleaningStatus.IN_PROGRESS && !task.startedAt) {
      updateData.startedAt = new Date();
    }
    if (status === CleaningStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }
    if (inspectionNotes) {
      updateData.inspectionNotes = inspectionNotes;
    }

    return this.prisma.cleaningTask.update({
      where: { id },
      data: updateData,
    });
  }

  async assignTask(id: number, assignedToId: number) {
    const task = await this.prisma.cleaningTask.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException('保洁任务不存在');
    }

    return this.prisma.cleaningTask.update({
      where: { id },
      data: {
        assignedToId,
        status: CleaningStatus.ASSIGNED,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.cleaningTask.delete({ where: { id } });
  }

  async getMyTasks(userId: number, params: { status?: CleaningStatus; date?: string }) {
    const { status, date } = params;

    const where: any = { assignedToId: userId };
    if (status) where.status = status;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.scheduledAt = { gte: startOfDay, lte: endOfDay };
    }

    return this.prisma.cleaningTask.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { scheduledAt: 'asc' },
      ],
      include: {
        property: { select: { name: true } },
        room: { select: { roomNumber: true, roomType: true } },
        order: { select: { orderNo: true, guestName: true } },
      },
    });
  }
}
