import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BULL_QUEUES } from '../../common/bull/queue.constants';
import {
  CreateConfirmationTaskDto,
  UpdateConfirmationTaskDto,
  AssignTaskDto,
  UpdateTaskStatusDto,
  QueryTasksDto,
  TaskImageDto,
} from './dto/confirmation-task.dto';
import { TaskStatus, TaskType, UserRole } from '@prisma/client';
import * as dayjs from 'dayjs';

@Injectable()
export class ConfirmationTaskService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue(BULL_QUEUES.REMINDER) private reminderQueue: Queue,
  ) {}

  async create(createTaskDto: CreateConfirmationTaskDto, currentUser: any) {
    const project = await this.prisma.project.findUnique({
      where: { id: createTaskDto.projectId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    if (createTaskDto.assignedToId) {
      const assignee = await this.prisma.user.findUnique({
        where: { id: createTaskDto.assignedToId },
      });
      if (!assignee) {
        throw new NotFoundException('被分配人不存在');
      }
    }

    const task = await this.prisma.confirmationTask.create({
      data: {
        ...createTaskDto,
        createdById: currentUser.id,
        amount: createTaskDto.amount ? createTaskDto.amount as any : undefined,
      },
      include: {
        project: {
          select: { id: true, name: true, address: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
      },
    });

    await this.prisma.confirmationVersion.create({
      data: {
        taskId: task.id,
        version: 1,
        title: task.title,
        description: task.description,
        nodeName: task.nodeName,
        location: task.location,
        amount: task.amount,
        createdById: currentUser.id,
      },
    });

    if (task.deadline) {
      await this.reminderQueue.add(
        'check-overdue',
        { taskId: task.id },
        { delay: dayjs(task.deadline).diff(dayjs(), 'millisecond') },
      );
    }

    await this.reminderQueue.add(
      'check-missing-documents',
      { taskId: task.id },
      { delay: 5000 },
    );

    return task;
  }

  async findAll(queryTasksDto: QueryTasksDto, currentUser: any) {
    const {
      page = 1,
      limit = 10,
      keyword,
      type,
      status,
      projectId,
      assignedToId,
      createdById,
      startDate,
      endDate,
    } = queryTasksDto;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (createdById) {
      where.createdById = createdById;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (currentUser.role === UserRole.OWNER) {
      const projects = await this.prisma.project.findMany({
        where: { ownerId: currentUser.id },
        select: { id: true },
      });
      where.projectId = { in: projects.map((p) => p.id) };
    }

    if (currentUser.role === UserRole.FOREMAN) {
      where.createdById = currentUser.id;
    }

    if (currentUser.role === UserRole.DESIGNER) {
      where.createdById = currentUser.id;
    }

    const [tasks, total] = await Promise.all([
      this.prisma.confirmationTask.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            select: { id: true, name: true, address: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true, avatar: true, role: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true, avatar: true, role: true },
          },
          images: {
            orderBy: { order: 'asc' },
          },
        },
      }),
      this.prisma.confirmationTask.count({ where }),
    ]);

    return { data: tasks, total, page, limit };
  }

  async findOne(id: string, currentUser: any) {
    const task = await this.prisma.confirmationTask.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, address: true, ownerId: true, projectManagerId: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true, role: true, phone: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, avatar: true, role: true, phone: true },
        },
        confirmedBy: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
        versions: {
          orderBy: { version: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true, avatar: true, role: true },
            },
            images: true,
          },
        },
        quoteVersions: {
          orderBy: { version: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true, avatar: true, role: true },
            },
          },
        },
        images: {
          orderBy: { order: 'asc' },
        },
        chatMessages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, name: true, avatar: true, role: true },
            },
          },
          take: 50,
        },
        disputes: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true, avatar: true, role: true },
            },
            resolvedBy: {
              select: { id: true, name: true, avatar: true, role: true },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    await this.checkTaskAccess(task, currentUser);

    return task;
  }

  async update(id: string, updateTaskDto: UpdateConfirmationTaskDto, currentUser: any) {
    const task = await this.prisma.confirmationTask.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    await this.checkTaskModifyPermission(task, currentUser);

    if (updateTaskDto.projectId && updateTaskDto.projectId !== task.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: updateTaskDto.projectId },
      });
      if (!project) {
        throw new NotFoundException('项目不存在');
      }
    }

    if (updateTaskDto.assignedToId) {
      const assignee = await this.prisma.user.findUnique({
        where: { id: updateTaskDto.assignedToId },
      });
      if (!assignee) {
        throw new NotFoundException('被分配人不存在');
      }
    }

    const newVersion = task.currentVersion + 1;

    const updateData: any = {
      ...updateTaskDto,
      currentVersion: newVersion,
      amount: updateTaskDto.amount ? updateTaskDto.amount as any : undefined,
    };

    const updatedTask = await this.prisma.confirmationTask.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: { id: true, name: true, address: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
      },
    });

    await this.prisma.confirmationVersion.create({
      data: {
        taskId: id,
        version: newVersion,
        title: updatedTask.title,
        description: updatedTask.description,
        nodeName: updatedTask.nodeName,
        location: updatedTask.location,
        amount: updatedTask.amount,
        changeReason: '更新任务信息',
        createdById: currentUser.id,
      },
    });

    await this.reminderQueue.add(
      'check-missing-documents',
      { taskId: id },
      { delay: 3000 },
    );

    return updatedTask;
  }

  async remove(id: string, currentUser: any) {
    const task = await this.prisma.confirmationTask.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.id !== task.createdById
    ) {
      throw new ForbiddenException('无权删除此任务');
    }

    await this.prisma.confirmationTask.delete({
      where: { id },
    });
  }

  async assign(id: string, assignTaskDto: AssignTaskDto, currentUser: any) {
    const task = await this.prisma.confirmationTask.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.PROJECT_MANAGER
    ) {
      throw new ForbiddenException('无权分派任务');
    }

    const assignee = await this.prisma.user.findUnique({
      where: { id: assignTaskDto.assignedToId },
    });

    if (!assignee) {
      throw new NotFoundException('被分配人不存在');
    }

    const updatedTask = await this.prisma.confirmationTask.update({
      where: { id },
      data: { assignedToId: assignTaskDto.assignedToId },
      include: {
        project: {
          select: { id: true, name: true, address: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
      },
    });

    await this.reminderQueue.add('task-assigned', {
      taskId: id,
      userId: assignTaskDto.assignedToId,
    });

    return updatedTask;
  }

  async updateStatus(id: string, updateStatusDto: UpdateTaskStatusDto, currentUser: any) {
    const task = await this.prisma.confirmationTask.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    await this.validateStatusTransition(task.status, updateStatusDto.status, currentUser, task);

    const updateData: any = {
      status: updateStatusDto.status,
    };

    if (updateStatusDto.status === TaskStatus.APPROVED || updateStatusDto.status === TaskStatus.REJECTED) {
      updateData.confirmedAt = new Date();
      updateData.confirmedById = currentUser.id;
    }

    const updatedTask = await this.prisma.confirmationTask.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: { id: true, name: true, address: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
        confirmedBy: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
      },
    });

    return updatedTask;
  }

  async addImages(taskId: string, images: TaskImageDto[], currentUser: any) {
    const task = await this.prisma.confirmationTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    await this.checkTaskModifyPermission(task, currentUser);

    const createdImages = await Promise.all(
      images.map((image, index) =>
        this.prisma.taskImage.create({
          data: {
            taskId,
            type: image.type,
            url: image.url,
            thumbnailUrl: image.thumbnailUrl,
            description: image.description,
            order: image.order ?? index,
          },
        }),
      ),
    );

    return createdImages;
  }

  async removeImage(taskId: string, imageId: string, currentUser: any) {
    const task = await this.prisma.confirmationTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    const image = await this.prisma.taskImage.findUnique({
      where: { id: imageId },
    });

    if (!image || image.taskId !== taskId) {
      throw new NotFoundException('图片不存在');
    }

    await this.checkTaskModifyPermission(task, currentUser);

    await this.prisma.taskImage.delete({
      where: { id: imageId },
    });
  }

  private async checkTaskAccess(task: any, currentUser: any) {
    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    if (currentUser.role === UserRole.SUPERVISOR) {
      return;
    }

    if (currentUser.role === UserRole.OWNER) {
      if (task.project?.ownerId !== currentUser.id) {
        throw new ForbiddenException('无权访问此任务');
      }
      return;
    }

    if (currentUser.role === UserRole.PROJECT_MANAGER) {
      if (task.project?.projectManagerId === currentUser.id) {
        return;
      }
    }

    if (currentUser.id === task.createdById || currentUser.id === task.assignedToId) {
      return;
    }

    throw new ForbiddenException('无权访问此任务');
  }

  private async checkTaskModifyPermission(task: any, currentUser: any) {
    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    if (currentUser.role === UserRole.SUPERVISOR) {
      return;
    }

    if (currentUser.id === task.createdById) {
      if (task.status !== TaskStatus.PENDING) {
        throw new BadRequestException('任务已确认，无法修改');
      }
      return;
    }

    if (currentUser.role === UserRole.PROJECT_MANAGER && task.project?.projectManagerId === currentUser.id) {
      return;
    }

    throw new ForbiddenException('无权修改此任务');
  }

  private async validateStatusTransition(
    currentStatus: TaskStatus,
    newStatus: TaskStatus,
    currentUser: any,
    task: any,
  ) {
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.PENDING]: [TaskStatus.APPROVED, TaskStatus.REJECTED, TaskStatus.DISPUTED, TaskStatus.OVERDUE],
      [TaskStatus.APPROVED]: [],
      [TaskStatus.REJECTED]: [TaskStatus.PENDING],
      [TaskStatus.DISPUTED]: [TaskStatus.PENDING, TaskStatus.APPROVED, TaskStatus.REJECTED],
      [TaskStatus.OVERDUE]: [TaskStatus.APPROVED, TaskStatus.REJECTED],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(`无法从 ${currentStatus} 状态变更为 ${newStatus} 状态`);
    }

    if (newStatus === TaskStatus.APPROVED || newStatus === TaskStatus.REJECTED) {
      if (currentUser.role === UserRole.OWNER) {
        if (task.project?.ownerId !== currentUser.id) {
          throw new ForbiddenException('只有项目业主可以确认此任务');
        }
        return;
      }
      if (currentUser.role === UserRole.ADMIN) {
        return;
      }
      throw new ForbiddenException('只有业主可以确认或拒绝任务');
    }

    if (newStatus === TaskStatus.DISPUTED) {
      if (currentUser.role === UserRole.OWNER || currentUser.role === UserRole.ADMIN) {
        return;
      }
      throw new ForbiddenException('只有业主可以提出争议');
    }
  }

  async checkAndUpdateOverdue() {
    const now = new Date();
    const tasks = await this.prisma.confirmationTask.findMany({
      where: {
        status: TaskStatus.PENDING,
        deadline: {
          lt: now,
          not: null,
        },
        isOverdue: false,
      },
    });

    for (const task of tasks) {
      await this.prisma.confirmationTask.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.OVERDUE,
          isOverdue: true,
        },
      });

      await this.reminderQueue.add('task-overdue', {
        taskId: task.id,
        projectManagerId: task.projectId,
      });
    }

    return { updated: tasks.length };
  }
}
