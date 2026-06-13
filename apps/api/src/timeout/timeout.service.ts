import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RefundOrderService } from '../refund-order/refund-order.service';
import { ReminderService } from '../reminder/reminder.service';
import { RefundStatus } from '@prisma/client';
import { ReminderChannel } from '@solo/shared';

const TIMEOUT_QUEUE_KEY = 'refund:timeout:queue';
const WARNING_QUEUE_KEY = 'refund:warning:queue';
const PROCESSING_LOCK_KEY = 'refund:timeout:lock';
const WARNING_HOURS = 4;
const TIMEOUT_CHECK_INTERVAL = 60000;

@Injectable()
export class TimeoutService implements OnModuleInit {
  private readonly logger = new Logger(TimeoutService.name);
  private isRunning = false;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private refundService: RefundOrderService,
    private reminderService: ReminderService,
  ) {}

  async onModuleInit() {
    this.logger.log('Timeout service initialized');
    await this.syncDeadlinesToRedis();
    setInterval(() => this.checkTimeouts(), TIMEOUT_CHECK_INTERVAL);
  }

  async syncDeadlinesToRedis() {
    const lockKey = `${PROCESSING_LOCK_KEY}:sync`;
    const acquired = await this.redis.acquireLock(lockKey, 30000);
    if (!acquired) {
      this.logger.log('Sync already in progress, skipping');
      return;
    }

    try {
      this.logger.log('Syncing deadlines to Redis...');
      
      const activeOrders = await this.prisma.refundOrder.findMany({
        where: {
          status: { notIn: [RefundStatus.CLOSED, RefundStatus.TIMEOUT] },
        },
        select: { id: true, deadline: true, isTimeout: true },
      });

      const now = Date.now();
      const warningTime = now + WARNING_HOURS * 60 * 60 * 1000;

      for (const order of activeOrders) {
        const deadline = new Date(order.deadline).getTime();
        
        if (!order.isTimeout) {
          await this.redis.zadd(TIMEOUT_QUEUE_KEY, deadline, order.id);
          
          if (deadline < warningTime && deadline > now) {
            await this.redis.zadd(WARNING_QUEUE_KEY, deadline, order.id);
          }
        }
      }

      this.logger.log(`Synced ${activeOrders.length} deadlines to Redis`);
    } catch (error) {
      this.logger.error('Error syncing deadlines:', error);
    } finally {
      await this.redis.releaseLock(lockKey);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkTimeouts() {
    if (this.isRunning) return;
    this.isRunning = true;

    const lockKey = `${PROCESSING_LOCK_KEY}:check`;
    const acquired = await this.redis.acquireLock(lockKey, 30000);
    if (!acquired) {
      this.isRunning = false;
      return;
    }

    try {
      const now = Date.now();
      
      const warningOrders = await this.redis.zrangebyscore(WARNING_QUEUE_KEY, 0, now);
      for (const orderId of warningOrders) {
        await this.processWarning(orderId);
        await this.redis.zrem(WARNING_QUEUE_KEY, orderId);
      }

      const timeoutOrders = await this.redis.zrangebyscore(TIMEOUT_QUEUE_KEY, 0, now);
      for (const orderId of timeoutOrders) {
        await this.processTimeout(orderId);
        await this.redis.zrem(TIMEOUT_QUEUE_KEY, orderId);
        await this.redis.zrem(WARNING_QUEUE_KEY, orderId);
      }
    } catch (error) {
      this.logger.error('Error checking timeouts:', error);
    } finally {
      await this.redis.releaseLock(lockKey);
      this.isRunning = false;
    }
  }

  private async processWarning(orderId: string) {
    try {
      const order = await this.prisma.refundOrder.findUnique({
        where: { id: orderId },
        include: { assignee: true },
      });

      if (!order || order.status === RefundStatus.CLOSED || order.isTimeout) {
        return;
      }

      this.logger.warn(`Order ${order.orderNo} is approaching timeout (${order.deadline})`);

      await this.refundService.markTimeoutWarning(orderId);

      if (order.assigneeId) {
        await this.reminderService.sendReminder({
          refundOrderId: orderId,
          recipientIds: [order.assigneeId],
          message: `售后单「${order.orderNo}」将在 ${WARNING_HOURS} 小时内超时，请尽快处理！\n客户: ${order.customerName}\n原因: ${order.reason}`,
          channel: ReminderChannel.IN_APP,
        });
      }
    } catch (error) {
      this.logger.error(`Error processing warning for order ${orderId}:`, error);
    }
  }

  private async processTimeout(orderId: string) {
    try {
      const order = await this.prisma.refundOrder.findUnique({
        where: { id: orderId },
        include: { assignee: true },
      });

      if (!order || order.status === RefundStatus.CLOSED || order.isTimeout) {
        return;
      }

      this.logger.error(`Order ${order.orderNo} has timed out!`);

      const updated = await this.refundService.markTimeout(orderId);

      const recipientIds: string[] = [];
      if (order.assigneeId) recipientIds.push(order.assigneeId);

      const managers = await this.prisma.user.findMany({
        where: { role: { in: ['MANAGER', 'ADMIN'] }, isActive: true },
        select: { id: true },
      });
      recipientIds.push(...managers.map((m) => m.id));

      await this.reminderService.sendReminder({
        refundOrderId: orderId,
        recipientIds,
        message: `⚠️ 售后单已超时！\n单号: ${order.orderNo}\n客户: ${order.customerName}\n区域: ${order.region}\n原时限: ${order.deadline.toLocaleString()}\n原因: ${order.reason}`,
        channel: ReminderChannel.IN_APP,
      });

      return updated;
    } catch (error) {
      this.logger.error(`Error processing timeout for order ${orderId}:`, error);
    }
  }

  async addToQueue(orderId: string, deadline: Date) {
    const timestamp = new Date(deadline).getTime();
    const now = Date.now();
    const warningTime = now + WARNING_HOURS * 60 * 60 * 1000;

    await this.redis.zadd(TIMEOUT_QUEUE_KEY, timestamp, orderId);
    
    if (timestamp < warningTime && timestamp > now) {
      await this.redis.zadd(WARNING_QUEUE_KEY, timestamp, orderId);
    }

    this.logger.log(`Added order ${orderId} to timeout queue`);
  }

  async removeFromQueue(orderId: string) {
    await this.redis.zrem(TIMEOUT_QUEUE_KEY, orderId);
    await this.redis.zrem(WARNING_QUEUE_KEY, orderId);
  }

  async updateDeadline(orderId: string, newDeadline: Date) {
    await this.removeFromQueue(orderId);
    await this.addToQueue(orderId, newDeadline);
    
    await this.prisma.refundOrder.update({
      where: { id: orderId },
      data: { isTimeout: false },
    });
  }

  async getQueueStats() {
    const [timeoutCount, warningCount] = await Promise.all([
      this.redis.getClient().zcard(TIMEOUT_QUEUE_KEY),
      this.redis.getClient().zcard(WARNING_QUEUE_KEY),
    ]);

    return {
      pendingTimeout: timeoutCount,
      pendingWarning: warningCount,
    };
  }
}
