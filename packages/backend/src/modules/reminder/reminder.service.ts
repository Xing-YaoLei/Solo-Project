import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { QueryReminderDto, QueryRecipientDto } from './dto/query-reminder.dto';
import { SendReminderDto, ResendRecipientDto } from './dto/send-reminder.dto';
import { buildPaginatedResult } from '../../common/dto/pagination.dto';
import { ReminderStatus } from '@prisma/client';

@Injectable()
export class ReminderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createReminderDto: CreateReminderDto, senderId?: string) {
    const { recipients, ...reminderData } = createReminderDto;

    const hearing = await this.prisma.hearing.findUnique({
      where: { id: reminderData.hearingId },
    });
    if (!hearing) {
      throw new NotFoundException('关联的开庭记录不存在');
    }

    return this.prisma.reminder.create({
      data: {
        ...reminderData,
        scheduledTime: new Date(reminderData.scheduledTime),
        senderId,
        recipients: {
          create: recipients.map((r) => ({
            ...r,
          })),
        },
      },
      include: {
        recipients: true,
        sender: {
          select: { id: true, realName: true, username: true },
        },
      },
    });
  }

  async findAll(query: QueryReminderDto) {
    const { page = 1, limit = 20, hearingId, reminderType, status, senderId, scheduledTimeFrom, scheduledTimeTo } = query;

    const where: any = {};
    if (hearingId) where.hearingId = hearingId;
    if (reminderType) where.reminderType = reminderType;
    if (status) where.status = status;
    if (senderId) where.senderId = senderId;
    if (scheduledTimeFrom || scheduledTimeTo) {
      where.scheduledTime = {};
      if (scheduledTimeFrom) where.scheduledTime.gte = new Date(scheduledTimeFrom);
      if (scheduledTimeTo) where.scheduledTime.lte = new Date(scheduledTimeTo);
    }

    const [list, total] = await Promise.all([
      this.prisma.reminder.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          recipients: true,
          hearing: {
            select: { id: true, hearingNo: true, startTime: true, endTime: true },
          },
          sender: {
            select: { id: true, realName: true },
          },
        },
      }),
      this.prisma.reminder.count({ where }),
    ]);

    return buildPaginatedResult(list, total, page, limit);
  }

  async findOne(id: string) {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id },
      include: {
        recipients: true,
        hearing: {
          include: {
            caseInfo: { select: { id: true, caseNo: true, title: true } },
            court: { select: { id: true, name: true } },
            courtRoom: { select: { id: true, roomNo: true, roomName: true } },
          },
        },
        sender: {
          select: { id: true, realName: true, username: true, email: true, phone: true },
        },
      },
    });

    if (!reminder) {
      throw new NotFoundException('提醒记录不存在');
    }

    return reminder;
  }

  async update(id: string, updateReminderDto: UpdateReminderDto) {
    const reminder = await this.prisma.reminder.findUnique({ where: { id } });
    if (!reminder) {
      throw new NotFoundException('提醒记录不存在');
    }

    if (reminder.status === ReminderStatus.SENT && !updateReminderDto.status) {
      throw new BadRequestException('已发送的提醒不能修改内容');
    }

    const { recipients, scheduledTime, ...data } = updateReminderDto;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.reminder.update({
        where: { id },
        data: {
          ...data,
          ...(scheduledTime ? { scheduledTime: new Date(scheduledTime) } : {}),
        },
        include: { recipients: true },
      });

      if (recipients) {
        await tx.reminderRecipient.deleteMany({ where: { reminderId: id } });
        await tx.reminderRecipient.createMany({
          data: recipients.map((r) => ({
            ...r,
            reminderId: id,
          })),
        });
      }

      return tx.reminder.findUnique({
        where: { id },
        include: { recipients: true },
      });
    });
  }

  async remove(id: string) {
    const reminder = await this.prisma.reminder.findUnique({ where: { id } });
    if (!reminder) {
      throw new NotFoundException('提醒记录不存在');
    }

    return this.prisma.reminder.delete({ where: { id } });
  }

  async sendReminders(sendReminderDto: SendReminderDto, senderId: string) {
    const { reminderIds } = sendReminderDto;

    const reminders = await this.prisma.reminder.findMany({
      where: { id: { in: reminderIds } },
      include: { recipients: true },
    });

    if (reminders.length === 0) {
      throw new NotFoundException('未找到指定的提醒记录');
    }

    const results = [];

    for (const reminder of reminders) {
      if (reminder.status === ReminderStatus.SENT) {
        results.push({ id: reminder.id, success: false, message: '该提醒已发送' });
        continue;
      }

      try {
        const now = new Date();
        const updatedReminder = await this.prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: ReminderStatus.SENT,
            sentAt: now,
            senderId,
          },
          include: { recipients: true },
        });

        await this.prisma.reminderRecipient.updateMany({
          where: { reminderId: reminder.id },
          data: {
            status: ReminderStatus.SENT,
            deliveredAt: now,
          },
        });

        results.push({ id: reminder.id, success: true, message: '发送成功' });
      } catch (error) {
        results.push({ id: reminder.id, success: false, message: error.message });
      }
    }

    return results;
  }

  async resendReminder(id: string, resendRecipientDto: ResendRecipientDto, senderId: string) {
    const reminder = await this.prisma.reminder.findUnique({ where: { id } });
    if (!reminder) {
      throw new NotFoundException('提醒记录不存在');
    }

    const { recipientIds } = resendRecipientDto;

    const whereCondition: any = { reminderId: id };
    if (recipientIds && recipientIds.length > 0) {
      whereCondition.id = { in: recipientIds };
    } else {
      whereCondition.status = ReminderStatus.FAILED;
    }

    const recipients = await this.prisma.reminderRecipient.findMany({ where: whereCondition });

    if (recipients.length === 0) {
      throw new BadRequestException('没有需要重发的接收人');
    }

    const now = new Date();

    await this.prisma.reminderRecipient.updateMany({
      where: whereCondition,
      data: {
        status: ReminderStatus.SENT,
        deliveredAt: now,
        failReason: null,
      },
    });

    await this.prisma.reminder.update({
      where: { id },
      data: {
        status: ReminderStatus.SENT,
        sentAt: now,
        senderId,
        retryCount: { increment: 1 },
      },
    });

    return {
      success: true,
      resentCount: recipients.length,
      message: `成功重发 ${recipients.length} 条提醒`,
    };
  }

  async findRecipients(query: QueryRecipientDto) {
    const { page = 1, limit = 20, reminderId, userId, clientId, status } = query;

    const where: any = {};
    if (reminderId) where.reminderId = reminderId;
    if (userId) where.userId = userId;
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    const [list, total] = await Promise.all([
      this.prisma.reminderRecipient.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'asc' },
        include: {
          reminder: {
            select: { id: true, title: true, reminderType: true, scheduledTime: true },
          },
          user: { select: { id: true, realName: true, username: true } },
          client: { select: { id: true, name: true, clientNo: true } },
        },
      }),
      this.prisma.reminderRecipient.count({ where }),
    ]);

    return buildPaginatedResult(list, total, page, limit);
  }

  async updateRecipientStatus(id: string, status: ReminderStatus) {
    const recipient = await this.prisma.reminderRecipient.findUnique({ where: { id } });
    if (!recipient) {
      throw new NotFoundException('接收人记录不存在');
    }

    const updateData: any = { status };
    const now = new Date();
    if (status === ReminderStatus.READ) updateData.readAt = now;
    if (status === ReminderStatus.CONFIRMED) updateData.confirmedAt = now;

    return this.prisma.reminderRecipient.update({
      where: { id },
      data: updateData,
    });
  }

  async getReminderStats(hearingId?: string) {
    const where: any = {};
    if (hearingId) where.hearingId = hearingId;

    const [total, pending, sent, failed, read, confirmed] = await Promise.all([
      this.prisma.reminder.count({ where }),
      this.prisma.reminder.count({ where: { ...where, status: ReminderStatus.PENDING } }),
      this.prisma.reminder.count({ where: { ...where, status: ReminderStatus.SENT } }),
      this.prisma.reminder.count({ where: { ...where, status: ReminderStatus.FAILED } }),
      this.prisma.reminder.count({ where: { ...where, status: ReminderStatus.READ } }),
      this.prisma.reminder.count({ where: { ...where, status: ReminderStatus.CONFIRMED } }),
    ]);

    const typeStats = await this.prisma.reminder.groupBy({
      by: ['reminderType'],
      where,
      _count: { id: true },
    });

    return {
      total,
      statusStats: { pending, sent, failed, read, confirmed },
      typeStats: typeStats.map((t) => ({
        type: t.reminderType,
        count: t._count.id,
      })),
    };
  }
}
