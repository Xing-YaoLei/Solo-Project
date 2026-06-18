import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BULL_QUEUES } from '../../common/bull/queue.constants';
import { QueryRemindersDto, CreateReminderDto } from './dto/reminder.dto';
import { ReminderStatus, UserRole } from '@prisma/client';

@Injectable()
export class ReminderService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue(BULL_QUEUES.REMINDER) private reminderQueue: Queue,
  ) {}

  async create(createReminderDto: CreateReminderDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: createReminderDto.userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const reminder = await this.prisma.reminder.create({
      data: {
        ...createReminderDto,
        scheduledAt: createReminderDto.scheduledAt ? new Date(createReminderDto.scheduledAt) : undefined,
      },
      include: {
        task: {
          select: { id: true, title: true, status: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!reminder.scheduledAt || reminder.scheduledAt <= new Date()) {
      await this.reminderQueue.add('send-reminder', { reminderId: reminder.id });
    } else {
      const delay = new Date(reminder.scheduledAt).getTime() - Date.now();
      await this.reminderQueue.add('send-reminder', { reminderId: reminder.id }, { delay });
    }

    return reminder;
  }

  async findAll(queryRemindersDto: QueryRemindersDto, currentUser: any) {
    const { page = 1, limit = 20, type, status, taskId } = queryRemindersDto;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (currentUser.role !== UserRole.ADMIN) {
      where.userId = currentUser.id;
    } else if (queryRemindersDto.userId) {
      where.userId = queryRemindersDto.userId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (taskId) {
      where.taskId = taskId;
    }

    const [reminders, total] = await Promise.all([
      this.prisma.reminder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          task: {
            select: { id: true, title: true, status: true },
          },
        },
      }),
      this.prisma.reminder.count({ where }),
    ]);

    return { data: reminders, total, page, limit };
  }

  async findOne(id: string, currentUser: any) {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id },
      include: {
        task: {
          select: { id: true, title: true, status: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!reminder) {
      throw new NotFoundException('提醒不存在');
    }

    if (currentUser.role !== UserRole.ADMIN && reminder.userId !== currentUser.id) {
      throw new ForbiddenException('无权访问此提醒');
    }

    return reminder;
  }

  async markAsRead(id: string, currentUser: any) {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id },
    });

    if (!reminder) {
      throw new NotFoundException('提醒不存在');
    }

    if (currentUser.role !== UserRole.ADMIN && reminder.userId !== currentUser.id) {
      throw new ForbiddenException('无权操作此提醒');
    }

    const updatedReminder = await this.prisma.reminder.update({
      where: { id },
      data: {
        status: ReminderStatus.READ,
        readAt: new Date(),
      },
      include: {
        task: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    return updatedReminder;
  }

  async markAllAsRead(currentUser: any) {
    const result = await this.prisma.reminder.updateMany({
      where: {
        userId: currentUser.id,
        status: ReminderStatus.SENT,
      },
      data: {
        status: ReminderStatus.READ,
        readAt: new Date(),
      },
    });

    return { updated: result.count };
  }

  async delete(id: string, currentUser: any) {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id },
    });

    if (!reminder) {
      throw new NotFoundException('提醒不存在');
    }

    if (currentUser.role !== UserRole.ADMIN && reminder.userId !== currentUser.id) {
      throw new ForbiddenException('无权删除此提醒');
    }

    await this.prisma.reminder.delete({
      where: { id },
    });
  }

  async getUnreadCount(currentUser: any) {
    const count = await this.prisma.reminder.count({
      where: {
        userId: currentUser.id,
        status: ReminderStatus.SENT,
      },
    });

    return { unreadCount: count };
  }
}
