import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateChatMessageDto } from './dto/chat.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createMessage(taskId: string, createMessageDto: CreateChatMessageDto, currentUser: any) {
    const task = await this.prisma.confirmationTask.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    await this.checkAccess(task, currentUser);

    const message = await this.prisma.chatMessage.create({
      data: {
        taskId,
        userId: currentUser.id,
        content: createMessageDto.content,
        type: createMessageDto.type || 'TEXT',
      },
      include: {
        user: {
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

    return message;
  }

  async getMessages(taskId: string, currentUser: any, page = 1, limit = 50) {
    const task = await this.prisma.confirmationTask.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    await this.checkAccess(task, currentUser);

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: { taskId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.chatMessage.count({ where: { taskId } }),
    ]);

    return { data: messages.reverse(), total, page, limit };
  }

  async deleteMessage(taskId: string, messageId: string, currentUser: any) {
    const task = await this.prisma.confirmationTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message || message.taskId !== taskId) {
      throw new NotFoundException('消息不存在');
    }

    if (message.userId !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('无权删除此消息');
    }

    await this.prisma.chatMessage.delete({
      where: { id: messageId },
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

    if (
      currentUser.role === UserRole.SUPERVISOR &&
      task.project?.projectManagerId === currentUser.id
    ) {
      return;
    }

    if (task.createdById === currentUser.id || task.assignedToId === currentUser.id) {
      return;
    }

    throw new ForbiddenException('无权访问此任务的聊天记录');
  }
}
