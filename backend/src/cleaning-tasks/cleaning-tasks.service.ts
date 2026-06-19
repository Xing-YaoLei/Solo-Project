import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CleaningTaskStatus, LogAction } from '@prisma/client';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class CleaningTasksService {
  constructor(
    private prisma: PrismaService,
    private systemLogsService: SystemLogsService,
  ) {}

  async findAll(params: {
    status?: CleaningTaskStatus;
    propertyId?: string;
    assignedToId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { status, propertyId, assignedToId, startDate, endDate } = params;
    
    return this.prisma.cleaningTask.findMany({
      where: {
        status,
        propertyId,
        assignedToId,
        taskDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        property: { select: { id: true, name: true, roomNumber: true } },
        assignedTo: { select: { id: true, name: true, role: true } },
        booking: { select: { id: true, guestName: true, checkInDate: true, checkOutDate: true } },
      },
      orderBy: { scheduledStart: 'asc' },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.cleaningTask.findUnique({
      where: { id },
      include: {
        property: true,
        assignedTo: { select: { id: true, name: true, role: true, phone: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        completedBy: { select: { id: true, name: true, role: true } },
        booking: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { id: true, name: true } } },
        },
      },
    });
    
    if (!task) {
      throw new NotFoundException('保洁任务不存在');
    }
    
    return task;
  }

  async create(data: {
    propertyId: string;
    bookingId?: string;
    taskDate: Date;
    scheduledStart: Date;
    scheduledEnd: Date;
    priority?: string;
    notes?: string;
    createdById?: string;
  }) {
    const task = await this.prisma.cleaningTask.create({
      data,
    });

    await this.systemLogsService.create({
      entityType: 'CleaningTask',
      entityId: task.id,
      action: LogAction.CREATE,
      reason: '创建保洁任务',
      details: JSON.stringify({ taskDate: data.taskDate }),
      createdById: data.createdById,
    });

    return task;
  }

  async assign(id: string, assignedToId: string, assignedById?: string) {
    const task = await this.prisma.cleaningTask.update({
      where: { id },
      data: { assignedToId },
    });

    await this.systemLogsService.create({
      entityType: 'CleaningTask',
      entityId: id,
      action: LogAction.ASSIGN,
      reason: '分派保洁任务',
      details: JSON.stringify({ assignedToId }),
      createdById: assignedById,
    });

    return task;
  }

  async updateStatus(
    id: string,
    status: CleaningTaskStatus,
    updatedById?: string,
    reason?: string,
  ) {
    const updateData: any = { status };
    
    if (status === CleaningTaskStatus.IN_PROGRESS) {
      updateData.actualStart = new Date();
    } else if (status === CleaningTaskStatus.COMPLETED) {
      updateData.actualEnd = new Date();
      updateData.completedById = updatedById;
    }

    const task = await this.prisma.cleaningTask.update({
      where: { id },
      data: updateData,
    });

    const action = this.statusToAction(status);
    await this.systemLogsService.create({
      entityType: 'CleaningTask',
      entityId: id,
      action,
      reason: reason || `状态更新为 ${status}`,
      details: JSON.stringify({ status }),
      createdById: updatedById,
    });

    return task;
  }

  private statusToAction(status: CleaningTaskStatus): LogAction {
    switch (status) {
      case CleaningTaskStatus.COMPLETED:
        return LogAction.COMPLETE;
      case CleaningTaskStatus.CANCELLED:
        return LogAction.CANCEL;
      default:
        return LogAction.UPDATE;
    }
  }

  async update(id: string, data: {
    taskDate?: Date;
    scheduledStart?: Date;
    scheduledEnd?: Date;
    priority?: string;
    notes?: string;
    status?: CleaningTaskStatus;
  }, updatedById?: string) {
    const task = await this.prisma.cleaningTask.update({
      where: { id },
      data,
    });

    await this.systemLogsService.create({
      entityType: 'CleaningTask',
      entityId: id,
      action: LogAction.UPDATE,
      reason: '更新保洁任务',
      details: JSON.stringify(data),
      createdById: updatedById,
    });

    return task;
  }

  async getByDateRange(startDate: Date, endDate: Date, propertyId?: string) {
    return this.prisma.cleaningTask.findMany({
      where: {
        taskDate: { gte: startDate, lte: endDate },
        propertyId,
      },
      include: {
        property: { select: { id: true, name: true, roomNumber: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { taskDate: 'asc' },
    });
  }
}
