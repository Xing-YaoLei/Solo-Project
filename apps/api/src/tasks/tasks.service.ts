import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { BatchUpdateDto } from './dto/batch-update.dto';
import { PaginationDto, createPaginatedResult, PaginatedResult } from '@/common/dto/pagination.dto';
import { TaskStatus, TaskPriority, AuditType, OperationAction } from '@prisma/client';

const STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.DRAFT]: [TaskStatus.PENDING],
  [TaskStatus.PENDING]: [TaskStatus.ASSIGNED, TaskStatus.DRAFT],
  [TaskStatus.ASSIGNED]: [TaskStatus.IN_PROGRESS, TaskStatus.PENDING],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.SUBMITTED, TaskStatus.ASSIGNED],
  [TaskStatus.SUBMITTED]: [TaskStatus.REVIEWING, TaskStatus.IN_PROGRESS],
  [TaskStatus.REVIEWING]: [TaskStatus.APPROVED, TaskStatus.REJECTED],
  [TaskStatus.APPROVED]: [TaskStatus.ARCHIVED],
  [TaskStatus.REJECTED]: [TaskStatus.IN_PROGRESS, TaskStatus.DRAFT],
  [TaskStatus.ARCHIVED]: [TaskStatus.APPROVED],
};

const taskSelectFields = {
  id: true,
  taskNo: true,
  title: true,
  description: true,
  auditType: true,
  priority: true,
  status: true,
  department: true,
  auditPeriod: true,
  dueDate: true,
  assignedAt: true,
  startedAt: true,
  submittedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  relatedTaskIds: true,
  createdBy: {
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
    },
  },
  assignedTo: {
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
    },
  },
  businessOwner: {
    select: {
      id: true,
      username: true,
      fullName: true,
    },
  },
  _count: {
    select: {
      evidences: true,
      reviews: true,
      checklistExecs: true,
      samplingRecords: true,
    },
  },
};

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async generateTaskNo(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `AT${year}`;

    const lastTask = await this.prisma.auditTask.findFirst({
      where: { taskNo: { startsWith: prefix } },
      orderBy: { taskNo: 'desc' },
    });

    let sequence = 1;
    if (lastTask) {
      const match = lastTask.taskNo.match(/(\d{5})$/);
      if (match) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}${String(sequence).padStart(5, '0')}`;
  }

  private validateStatusTransition(current: TaskStatus, next: TaskStatus): boolean {
    const allowed = STATUS_TRANSITIONS[current] || [];
    return allowed.includes(next);
  }

  async create(createTaskDto: CreateTaskDto, userId: string) {
    const taskNo = await this.generateTaskNo();

    let status: TaskStatus = createTaskDto.assignedToId ? TaskStatus.ASSIGNED : TaskStatus.DRAFT;
    if (createTaskDto.assignedToId && !createTaskDto.dueDate) {
      status = TaskStatus.PENDING;
    }

    const data: any = {
      ...createTaskDto,
      taskNo,
      status,
      createdById: userId,
      assignedAt: createTaskDto.assignedToId ? new Date() : null,
    };

    if (createTaskDto.dueDate) {
      data.dueDate = new Date(createTaskDto.dueDate);
    }

    const task = await this.prisma.auditTask.create({
      data,
      select: taskSelectFields,
    });

    this.logger.log(`创建任务成功: ${task.taskNo}`);
    return task;
  }

  async findAll(
    pagination: PaginationDto,
    filters?: {
      status?: TaskStatus;
      priority?: TaskPriority;
      auditType?: AuditType;
      assignedToId?: string;
      createdById?: string;
      businessOwnerId?: string;
      department?: string;
      auditPeriod?: string;
    },
  ): Promise<PaginatedResult<any>> {
    const { skip, take, keyword, sortBy, sortOrder } = pagination;

    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.auditType) where.auditType = filters.auditType;
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters?.createdById) where.createdById = filters.createdById;
    if (filters?.businessOwnerId) where.businessOwnerId = filters.businessOwnerId;
    if (filters?.department) where.department = filters.department;
    if (filters?.auditPeriod) where.auditPeriod = filters.auditPeriod;

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { taskNo: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.auditTask.count({ where }),
      this.prisma.auditTask.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: taskSelectFields,
      }),
    ]);

    return createPaginatedResult(data, total, pagination.page, pagination.pageSize);
  }

  async findOne(id: string) {
    const task = await this.prisma.auditTask.findUnique({
      where: { id },
      select: {
        ...taskSelectFields,
        evidences: {
          take: 20,
          select: {
            id: true,
            evidenceNo: true,
            title: true,
            category: true,
            status: true,
          },
        },
        reviews: {
          take: 10,
          orderBy: { reviewedAt: 'desc' },
          select: {
            id: true,
            result: true,
            comment: true,
            reviewRound: true,
            reviewedAt: true,
            reviewer: {
              select: { fullName: true },
            },
          },
        },
      },
    });

    if (!task) {
      throw new HttpException('任务不存在', HttpStatus.NOT_FOUND);
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    const existing = await this.prisma.auditTask.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpException('任务不存在', HttpStatus.NOT_FOUND);
    }

    if (updateTaskDto.status && updateTaskDto.status !== existing.status) {
      if (!this.validateStatusTransition(existing.status, updateTaskDto.status)) {
        throw new HttpException(
          `状态流转不允许: ${existing.status} -> ${updateTaskDto.status}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const data: any = { ...updateTaskDto };
    if (updateTaskDto.dueDate) {
      data.dueDate = new Date(updateTaskDto.dueDate);
    }

    if (updateTaskDto.assignedToId && updateTaskDto.assignedToId !== existing.assignedToId) {
      data.assignedAt = new Date();
      if (existing.status === TaskStatus.PENDING || existing.status === TaskStatus.DRAFT) {
        data.status = TaskStatus.ASSIGNED;
      }
    }

    if (updateTaskDto.status === TaskStatus.IN_PROGRESS && !existing.startedAt) {
      data.startedAt = new Date();
    }
    if (updateTaskDto.status === TaskStatus.SUBMITTED && !existing.submittedAt) {
      data.submittedAt = new Date();
    }
    if (updateTaskDto.status === TaskStatus.APPROVED && !existing.completedAt) {
      data.completedAt = new Date();
    }

    const updated = await this.prisma.auditTask.update({
      where: { id },
      data,
      select: taskSelectFields,
    });

    this.logger.log(`更新任务成功: ${updated.taskNo}`);
    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.auditTask.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpException('任务不存在', HttpStatus.NOT_FOUND);
    }

    if (!([TaskStatus.DRAFT, TaskStatus.PENDING] as TaskStatus[]).includes(existing.status)) {
      throw new HttpException('只有草稿或待分派状态的任务可以删除', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.auditTask.delete({ where: { id } });

    this.logger.log(`删除任务成功: ${existing.taskNo}`);
    return { message: '任务已删除' };
  }

  async assign(id: string, assignTaskDto: AssignTaskDto) {
    const existing = await this.prisma.auditTask.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpException('任务不存在', HttpStatus.NOT_FOUND);
    }

    if (existing.status !== TaskStatus.PENDING && existing.status !== TaskStatus.DRAFT) {
      throw new HttpException('只有待分派或草稿状态可以分派', HttpStatus.BAD_REQUEST);
    }

    const user = await this.prisma.user.findUnique({ where: { id: assignTaskDto.assignedToId } });
    if (!user) {
      throw new HttpException('分派用户不存在', HttpStatus.NOT_FOUND);
    }

    const data: any = {
      assignedToId: assignTaskDto.assignedToId,
      assignedAt: new Date(),
      status: TaskStatus.ASSIGNED,
    };

    if (assignTaskDto.businessOwnerId) {
      data.businessOwnerId = assignTaskDto.businessOwnerId;
    }
    if (assignTaskDto.dueDate) {
      data.dueDate = new Date(assignTaskDto.dueDate);
    }

    const updated = await this.prisma.auditTask.update({
      where: { id },
      data,
      select: taskSelectFields,
    });

    this.logger.log(`分派任务成功: ${updated.taskNo} -> ${user.username}`);
    return updated;
  }

  async batchUpdate(batchUpdateDto: BatchUpdateDto, operatorId: string) {
    const { taskIds, status, assignedToId, priority } = batchUpdateDto;

    const tasks = await this.prisma.auditTask.findMany({
      where: { id: { in: taskIds } },
      select: { id: true, status: true, taskNo: true, assignedToId: true },
    });

    if (tasks.length !== taskIds.length) {
      const missingIds = taskIds.filter((id) => !tasks.find((t) => t.id === id));
      throw new HttpException(`部分任务不存在: ${missingIds.join(', ')}`, HttpStatus.NOT_FOUND);
    }

    const updates = tasks.map(async (task) => {
      const updateData: any = {};

      if (status && status !== task.status) {
        if (!this.validateStatusTransition(task.status, status)) {
          throw new HttpException(
            `任务 ${task.taskNo} 状态流转不允许: ${task.status} -> ${status}`,
            HttpStatus.BAD_REQUEST,
          );
        }
        updateData.status = status;

        if (status === TaskStatus.IN_PROGRESS) updateData.startedAt = new Date();
        if (status === TaskStatus.SUBMITTED) updateData.submittedAt = new Date();
        if (status === TaskStatus.APPROVED) updateData.completedAt = new Date();
      }

      if (assignedToId && assignedToId !== task.assignedToId) {
        updateData.assignedToId = assignedToId;
        updateData.assignedAt = new Date();
        if (task.status === TaskStatus.PENDING || task.status === TaskStatus.DRAFT) {
          updateData.status = TaskStatus.ASSIGNED;
        }
      }

      if (priority) {
        updateData.priority = priority;
      }

      if (Object.keys(updateData).length === 0) {
        return null;
      }

      return this.prisma.auditTask.update({
        where: { id: task.id },
        data: updateData,
        select: { id: true, taskNo: true, status: true, assignedToId: true },
      });
    });

    const results = await Promise.all(updates);
    const updatedCount = results.filter((r) => r !== null).length;

    this.logger.log(`批量更新任务完成，共处理 ${updatedCount} 个任务`);

    return {
      message: `批量操作完成，成功更新 ${updatedCount} 个任务`,
      updatedCount,
      results: results.filter(Boolean),
    };
  }

  async getKanbanData(userId?: string) {
    const statuses = Object.values(TaskStatus);

    const where: any = {};
    if (userId) {
      where.OR = [
        { assignedToId: userId },
        { createdById: userId },
        { businessOwnerId: userId },
      ];
    }

    const tasks = await this.prisma.auditTask.findMany({
      where,
      select: {
        id: true,
        taskNo: true,
        title: true,
        status: true,
        priority: true,
        auditType: true,
        dueDate: true,
        department: true,
        assignedTo: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        _count: {
          select: {
            evidences: true,
          },
        },
      },
    });

    const kanban: Record<string, any[]> = {};
    for (const status of statuses) {
      kanban[status] = tasks
        .filter((t) => t.status === status)
        .map((t) => ({
          ...t,
          priorityOrder: this.getPriorityOrder(t.priority),
        }))
        .sort((a, b) => b.priorityOrder - a.priorityOrder);
    }

    const stats = {
      total: tasks.length,
      byStatus: statuses.reduce((acc, s) => {
        acc[s] = kanban[s].length;
        return acc;
      }, {} as Record<string, number>),
      overdue: tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < new Date() && !['APPROVED', 'ARCHIVED'].includes(t.status),
      ).length,
    };

    return { kanban, stats };
  }

  private getPriorityOrder(priority: TaskPriority): number {
    const order: Record<TaskPriority, number> = {
      [TaskPriority.URGENT]: 4,
      [TaskPriority.HIGH]: 3,
      [TaskPriority.MEDIUM]: 2,
      [TaskPriority.LOW]: 1,
    };
    return order[priority] || 0;
  }

  async getTaskStats() {
    const total = await this.prisma.auditTask.count();
    const byStatus = await this.prisma.auditTask.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    const byPriority = await this.prisma.auditTask.groupBy({
      by: ['priority'],
      _count: { priority: true },
    });
    const byAuditType = await this.prisma.auditTask.groupBy({
      by: ['auditType'],
      _count: { auditType: true },
    });

    return {
      total,
      byStatus: byStatus.map((g) => ({ status: g.status, count: g._count.status })),
      byPriority: byPriority.map((g) => ({ priority: g.priority, count: g._count.priority })),
      byAuditType: byAuditType.map((g) => ({ auditType: g.auditType, count: g._count.auditType })),
    };
  }
}
