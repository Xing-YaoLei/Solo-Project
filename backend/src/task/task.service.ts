import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogService } from '../system-log/system-log.service';
import { NotificationService } from '../notification/notification.service';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private systemLogService: SystemLogService,
    private notificationService: NotificationService,
  ) {}

  async findAll(params?: {
    scheduleId?: number;
    assigneeId?: number;
    status?: TaskStatus;
    type?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { scheduleId, assigneeId, status, type, page = 1, pageSize = 20 } = params || {};
    const where: any = {};

    if (scheduleId) where.scheduleId = scheduleId;
    if (assigneeId) where.assigneeId = assigneeId;
    if (status) where.status = status;
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.performanceTask.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { priority: 'asc', createdAt: 'desc' },
        include: {
          schedule: { select: { id: true, title: true, startTime: true, venue: true } },
          assignee: { select: { id: true, name: true, role: true } },
          creator: { select: { id: true, name: true } },
        },
      }),
      this.prisma.performanceTask.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async findById(id: number) {
    return this.prisma.performanceTask.findUnique({
      where: { id },
      include: {
        schedule: true,
        assignee: true,
        creator: true,
        changeLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async create(data: {
    scheduleId: number;
    title: string;
    description?: string;
    type: string;
    priority?: number;
    status?: TaskStatus;
    creatorId: number;
    startTime?: Date;
    endTime?: Date;
    dueTime?: Date;
    remark?: string;
  }) {
    const task = await this.prisma.performanceTask.create({
      data,
      include: { schedule: true, creator: true },
    });

    await this.systemLogService.create({
      action: 'CREATE',
      module: 'task',
      description: `创建任务: ${task.title}`,
      operatorId: data.creatorId,
      relatedId: task.id,
      relatedType: 'PerformanceTask',
    });

    return task;
  }

  async update(id: number, data: any, operatorId?: number) {
    const oldTask = await this.prisma.performanceTask.findUnique({ where: { id } });
    const task = await this.prisma.performanceTask.update({
      where: { id },
      data,
      include: { schedule: true, assignee: true },
    });

    const changeLogs = [];
    const fields = ['title', 'description', 'type', 'priority', 'status', 'assigneeId', 'startTime', 'endTime', 'dueTime', 'remark'];
    for (const field of fields) {
      if (data[field] !== undefined && data[field] !== oldTask[field]) {
        changeLogs.push({
          taskId: id,
          fieldName: field,
          oldValue: oldTask[field]?.toString() || null,
          newValue: data[field]?.toString() || null,
          operatorId,
        });
      }
    }

    if (changeLogs.length > 0) {
      await this.prisma.taskChangeLog.createMany({ data: changeLogs });
    }

    await this.systemLogService.create({
      action: 'UPDATE',
      module: 'task',
      description: `更新任务: ${task.title}`,
      operatorId,
      relatedId: task.id,
      relatedType: 'PerformanceTask',
    });

    if (data.assigneeId && data.assigneeId !== oldTask.assigneeId) {
      await this.notificationService.create({
        userId: data.assigneeId,
        title: '新任务分配',
        content: `您被分配了新任务：${task.title}，请及时处理。`,
        type: 'task',
        relatedId: task.id,
        relatedType: 'PerformanceTask',
      });
    }

    return task;
  }

  async assign(id: number, assigneeId: number, operatorId?: number) {
    const task = await this.prisma.performanceTask.update({
      where: { id },
      data: { assigneeId, status: TaskStatus.IN_PROGRESS },
      include: { schedule: true, assignee: true },
    });

    await this.prisma.taskChangeLog.create({
      data: {
        taskId: id,
        fieldName: 'assigneeId',
        oldValue: null,
        newValue: assigneeId.toString(),
        operatorId,
        remark: '任务分派',
      },
    });

    await this.systemLogService.create({
      action: 'ASSIGN',
      module: 'task',
      description: `分派任务: ${task.title} 给 ${task.assignee?.name}`,
      operatorId,
      relatedId: task.id,
      relatedType: 'PerformanceTask',
    });

    await this.notificationService.create({
      userId: assigneeId,
      title: '任务分派通知',
      content: `您被分派了任务：${task.title}，演出：${task.schedule.title}`,
      type: 'task',
      relatedId: task.id,
      relatedType: 'PerformanceTask',
    });

    return task;
  }

  async updateStatus(id: number, status: TaskStatus, operatorId?: number, remark?: string) {
    const task = await this.prisma.performanceTask.update({
      where: { id },
      data: { 
        status,
        endTime: status === TaskStatus.COMPLETED ? new Date() : undefined,
      },
      include: { schedule: true },
    });

    await this.prisma.taskChangeLog.create({
      data: {
        taskId: id,
        fieldName: 'status',
        oldValue: status,
        newValue: status,
        operatorId,
        remark,
      },
    });

    await this.systemLogService.create({
      action: 'UPDATE',
      module: 'task',
      description: `任务状态变更: ${task.title} -> ${status}`,
      operatorId,
      relatedId: task.id,
      relatedType: 'PerformanceTask',
    });

    return task;
  }

  async remove(id: number, operatorId?: number) {
    const task = await this.prisma.performanceTask.delete({ where: { id } });

    await this.systemLogService.create({
      action: 'DELETE',
      module: 'task',
      description: `删除任务: ${task.title}`,
      operatorId,
      relatedId: id,
      relatedType: 'PerformanceTask',
    });

    return task;
  }

  async getTaskBoard(scheduleId: number) {
    const statuses = [TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED];
    const result: any = {};

    for (const status of statuses) {
      result[status] = await this.prisma.performanceTask.findMany({
        where: { scheduleId, status },
        orderBy: { priority: 'asc', createdAt: 'desc' },
        include: {
          assignee: { select: { id: true, name: true, role: true } },
          creator: { select: { id: true, name: true } },
        },
      });
    }

    return result;
  }
}
