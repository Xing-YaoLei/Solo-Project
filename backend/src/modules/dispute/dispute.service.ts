import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BULL_QUEUES } from '../../common/bull/queue.constants';
import { CreateDisputeDto, UpdateDisputeDto, ResolveDisputeDto } from './dto/dispute.dto';
import { DisputeStatus, TaskStatus, UserRole } from '@prisma/client';

@Injectable()
export class DisputeService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue(BULL_QUEUES.REMINDER) private reminderQueue: Queue,
  ) {}

  async create(taskId: string, createDisputeDto: CreateDisputeDto, currentUser: any) {
    const task = await this.prisma.confirmationTask.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (currentUser.role === UserRole.OWNER) {
      if (task.project?.ownerId !== currentUser.id) {
        throw new ForbiddenException('无权对此任务提出争议');
      }
    } else if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只有业主可以提出争议');
    }

    const dispute = await this.prisma.dispute.create({
      data: {
        taskId,
        title: createDisputeDto.title,
        description: createDisputeDto.description,
        reason: createDisputeDto.reason,
        createdById: currentUser.id,
        status: DisputeStatus.OPEN,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    await this.prisma.confirmationTask.update({
      where: { id: taskId },
      data: { status: TaskStatus.DISPUTED },
    });

    if (task.project?.projectManagerId) {
      await this.reminderQueue.add('dispute-opened', {
        disputeId: dispute.id,
        taskId,
        userId: task.project.projectManagerId,
      });
    }

    return dispute;
  }

  async findByTaskId(taskId: string, currentUser: any) {
    const task = await this.prisma.confirmationTask.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    await this.checkAccess(task, currentUser);

    const disputes = await this.prisma.dispute.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return disputes;
  }

  async findOne(id: string, currentUser: any) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        task: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('争议不存在');
    }

    await this.checkAccess(dispute.task, currentUser);

    return dispute;
  }

  async update(id: string, updateDisputeDto: UpdateDisputeDto, currentUser: any) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: { task: { include: { project: true } } },
    });

    if (!dispute) {
      throw new NotFoundException('争议不存在');
    }

    if (dispute.createdById !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('无权修改此争议');
    }

    if (dispute.status !== DisputeStatus.OPEN) {
      throw new BadRequestException('争议已关闭，无法修改');
    }

    const updatedDispute = await this.prisma.dispute.update({
      where: { id },
      data: updateDisputeDto,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return updatedDispute;
  }

  async resolve(id: string, resolveDisputeDto: ResolveDisputeDto, currentUser: any) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: { task: { include: { project: true } } },
    });

    if (!dispute) {
      throw new NotFoundException('争议不存在');
    }

    if (dispute.status !== DisputeStatus.OPEN) {
      throw new BadRequestException('争议已处理');
    }

    if (
      currentUser.role !== UserRole.SUPERVISOR &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('只有监理或管理员可以关闭争议');
    }

    if (currentUser.role === UserRole.SUPERVISOR) {
      const project = dispute.task.project;
      if (
        project?.projectManagerId !== currentUser.id &&
        dispute.task.createdById !== currentUser.id &&
        dispute.task.assignedToId !== currentUser.id
      ) {
        const isInvolved = await this.checkSupervisorInvolvement(dispute.taskId, currentUser.id);
        if (!isInvolved) {
          throw new ForbiddenException('无权处理此争议');
        }
      }
    }

    const resolvedDispute = await this.prisma.dispute.update({
      where: { id },
      data: {
        status: DisputeStatus.RESOLVED,
        resolution: resolveDisputeDto.resolution,
        resolvedById: currentUser.id,
        resolvedAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return resolvedDispute;
  }

  async close(id: string, resolveDisputeDto: ResolveDisputeDto, currentUser: any) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: { task: { include: { project: true } } },
    });

    if (!dispute) {
      throw new NotFoundException('争议不存在');
    }

    if (
      currentUser.role !== UserRole.SUPERVISOR &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('只有监理或管理员可以关闭争议');
    }

    if (currentUser.role === UserRole.SUPERVISOR) {
      const project = dispute.task.project;
      if (
        project?.projectManagerId !== currentUser.id &&
        dispute.task.createdById !== currentUser.id &&
        dispute.task.assignedToId !== currentUser.id
      ) {
        const isInvolved = await this.checkSupervisorInvolvement(dispute.taskId, currentUser.id);
        if (!isInvolved) {
          throw new ForbiddenException('无权关闭此争议');
        }
      }
    }

    const closedDispute = await this.prisma.dispute.update({
      where: { id },
      data: {
        status: DisputeStatus.CLOSED,
        resolution: resolveDisputeDto.resolution,
        resolvedById: currentUser.id,
        resolvedAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return closedDispute;
  }

  async delete(id: string, currentUser: any) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
    });

    if (!dispute) {
      throw new NotFoundException('争议不存在');
    }

    if (dispute.createdById !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('无权删除此争议');
    }

    await this.prisma.dispute.delete({
      where: { id },
    });
  }

  private async checkAccess(task: any, currentUser: any) {
    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    if (currentUser.role === UserRole.OWNER && task.project?.ownerId === currentUser.id) {
      return;
    }

    if (
      currentUser.role === UserRole.PROJECT_MANAGER &&
      task.project?.projectManagerId === currentUser.id
    ) {
      return;
    }

    if (currentUser.role === UserRole.SUPERVISOR) {
      if (task.project?.projectManagerId === currentUser.id) {
        return;
      }
      const isInvolved = await this.checkSupervisorInvolvement(task.id, currentUser.id);
      if (isInvolved) {
        return;
      }
    }

    if (task.createdById === currentUser.id || task.assignedToId === currentUser.id) {
      return;
    }

    throw new ForbiddenException('无权访问此争议');
  }

  private async checkSupervisorInvolvement(taskId: string, supervisorId: string): Promise<boolean> {
    const chatMessages = await this.prisma.chatMessage.findMany({
      where: {
        taskId,
        userId: supervisorId,
      },
      take: 1,
    });

    if (chatMessages.length > 0) {
      return true;
    }

    const task = await this.prisma.confirmationTask.findUnique({
      where: { id: taskId },
      include: {
        chatMessages: {
          where: {
            type: 'SYSTEM',
            content: {
              contains: String(supervisorId),
            },
          },
          take: 1,
        },
      },
    });

    if (task?.chatMessages && task.chatMessages.length > 0) {
      return true;
    }

    const projects = await this.prisma.project.findMany({
      where: {
        OR: [
          { projectManagerId: supervisorId },
        ],
      },
      select: { id: true },
    });

    const projectIds = projects.map(p => p.id);
    const relatedTask = await this.prisma.confirmationTask.findFirst({
      where: {
        id: taskId,
        projectId: { in: projectIds },
      },
      select: { id: true },
    });

    return relatedTask !== null;
  }
}
