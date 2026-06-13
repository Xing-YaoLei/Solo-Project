import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ReminderChannel } from '@prisma/client';
import { SendReminderDto } from '@solo/shared';

const REMINDER_QUEUE_KEY = 'refund:reminder:queue';
const UNREAD_COUNT_KEY = 'refund:reminder:unread';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async sendReminder(data: SendReminderDto & { refundOrderId?: string }) {
    const { recipientIds, message, channel, refundOrderId } = data;
    
    const results = await Promise.all(
      recipientIds.map(async (recipientId) => {
        try {
          const reminder = await this.prisma.refundReminder.create({
            data: {
              refundOrderId,
              recipientId,
              message,
              channel: channel as any,
            },
            include: { recipient: { select: { id: true, name: true } } },
          });

          await this.redis.incr(`${UNREAD_COUNT_KEY}:${recipientId}`);
          await this.redis.lpush(
            `${REMINDER_QUEUE_KEY}:${channel}`,
            JSON.stringify({ reminderId: reminder.id, recipientId, message, channel }),
          );

          this.logger.log(`Reminder sent to ${recipientId} via ${channel}`);
          
          return { recipientId, success: true, reminder };
        } catch (error) {
          this.logger.error(`Failed to send reminder to ${recipientId}:`, error);
          return { recipientId, success: false, error: error.message };
        }
      }),
    );

    return { results };
  }

  async getReminders(params: {
    recipientId: string;
    read?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const { recipientId, read, page = 1, pageSize = 20 } = params;
    const where: any = { recipientId };
    if (read !== undefined) where.readAt = read ? { not: null } : null;

    const [total, items] = await Promise.all([
      this.prisma.refundReminder.count({ where }),
      this.prisma.refundReminder.findMany({
        where,
        include: {
          refundOrder: { select: { id: true, orderNo: true, status: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { sentAt: 'desc' },
      }),
    ]);

    const unreadCount = await this.getUnreadCount(recipientId);

    return { total, page, pageSize, items, unreadCount };
  }

  async getUnreadCount(recipientId: string): Promise<number> {
    const cached = await this.redis.get(`${UNREAD_COUNT_KEY}:${recipientId}`);
    if (cached !== null) return parseInt(cached);

    const count = await this.prisma.refundReminder.count({
      where: { recipientId, readAt: null },
    });

    await this.redis.set(`${UNREAD_COUNT_KEY}:${recipientId}`, count.toString());
    return count;
  }

  async markAsRead(reminderId: string, recipientId: string) {
    const reminder = await this.prisma.refundReminder.findUnique({
      where: { id: reminderId },
    });

    if (!reminder || reminder.recipientId !== recipientId) {
      throw new Error('Reminder not found or access denied');
    }

    if (reminder.readAt) return reminder;

    const updated = await this.prisma.refundReminder.update({
      where: { id: reminderId },
      data: { readAt: new Date() },
    });

    await this.redis.getClient().decr(`${UNREAD_COUNT_KEY}:${recipientId}`);

    return updated;
  }

  async markAllAsRead(recipientId: string) {
    const result = await this.prisma.refundReminder.updateMany({
      where: { recipientId, readAt: null },
      data: { readAt: new Date() },
    });

    await this.redis.set(`${UNREAD_COUNT_KEY}:${recipientId}`, '0');

    return { updatedCount: result.count };
  }

  async processQueue(channel: ReminderChannel) {
    while (true) {
      const item = await this.redis.rpop(`${REMINDER_QUEUE_KEY}:${channel}`);
      if (!item) break;

      try {
        const data = JSON.parse(item);
        await this.deliverReminder(data);
      } catch (error) {
        this.logger.error(`Error processing reminder queue item:`, error);
      }
    }
  }

  private async deliverReminder(data: any) {
    const { reminderId, recipientId, message, channel } = data;
    
    const user = await this.prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!user) return;

    switch (channel) {
      case 'EMAIL':
        if (user.email) {
          this.logger.log(`[EMAIL] Would send email to ${user.email}: ${message}`);
        }
        break;
      case 'SMS':
        if (user.phone) {
          this.logger.log(`[SMS] Would send SMS to ${user.phone}: ${message}`);
        }
        break;
      case 'WECHAT':
        this.logger.log(`[WECHAT] Would send WeChat to ${user.name}: ${message}`);
        break;
      case 'IN_APP':
      default:
        this.logger.log(`[IN_APP] Reminder for ${user.name}: ${message}`);
        break;
    }
  }
}
