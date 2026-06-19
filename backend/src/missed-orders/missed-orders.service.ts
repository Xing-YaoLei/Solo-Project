import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../redis/redis.service';
import { SystemLogsService } from '../system-logs/system-logs.service';
import { CleaningTaskStatus, LogAction, NotificationType, UserRole } from '@prisma/client';

@Injectable()
export class MissedOrdersService {
  private readonly logger = new Logger(MissedOrdersService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private redisService: RedisService,
    private systemLogsService: SystemLogsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkMissedOrders() {
    this.logger.log('开始检查漏单...');

    const now = new Date();
    const missedThreshold = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const tasks = await this.prisma.cleaningTask.findMany({
      where: {
        status: {
          in: [CleaningTaskStatus.PENDING, CleaningTaskStatus.IN_PROGRESS],
        },
        scheduledEnd: { lt: missedThreshold },
      },
      include: {
        property: { select: { name: true, roomNumber: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`发现 ${tasks.length} 个可能漏单的任务`);

    for (const task of tasks) {
      const existingMissed = await this.prisma.missedOrder.findUnique({
        where: { taskId: task.id },
      });

      if (!existingMissed) {
        await this.processMissedOrder(task);
      }
    }

    await this.redisService.set(
      'missed_orders:last_check',
      now.toISOString(),
    );
  }

  private async processMissedOrder(task: any) {
    const notifyRoles = [UserRole.MANAGER, UserRole.ADMIN];
    
    const missedOrder = await this.prisma.missedOrder.create({
      data: {
        taskId: task.id,
        propertyId: task.propertyId,
        reason: '任务超时未完成',
        status: 'open',
        notifiedRoles: notifyRoles,
      },
    });

    await this.prisma.cleaningTask.update({
      where: { id: task.id },
      data: { status: CleaningTaskStatus.MISSED },
    });

    const title = '保洁漏单提醒';
    const content = `房源 ${task.property?.name} (${task.property?.roomNumber}) 的保洁任务可能漏单，请及时处理。任务ID: ${task.id}`;

    await this.notificationsService.notifyRoles(
      notifyRoles,
      NotificationType.MISSED_ORDER,
      title,
      content,
      task.id,
      'CleaningTask',
    );

    if (task.assignedToId) {
      await this.notificationsService.create({
        userId: task.assignedToId,
        type: NotificationType.MISSED_ORDER,
        title: '您的保洁任务超时提醒',
        content: `您负责的房源 ${task.property?.name} 保洁任务已超时，请尽快处理。`,
        relatedId: task.id,
        relatedType: 'CleaningTask',
      });
    }

    await this.systemLogsService.create({
      entityType: 'MissedOrder',
      entityId: missedOrder.id,
      action: LogAction.CREATE,
      reason: '任务超时未完成，系统自动生成漏单记录',
      details: JSON.stringify({
        taskId: task.id,
        propertyId: task.propertyId,
        propertyName: task.property?.name,
        assignedToId: task.assignedToId,
        scheduledEnd: task.scheduledEnd,
      }),
    });

    await this.redisService.publish(
      'missed_orders:new',
      JSON.stringify(missedOrder),
    );

    this.logger.warn(`漏单已记录并通知: ${task.id}`);
  }

  async findAll(status?: string) {
    return this.prisma.missedOrder.findMany({
      where: status ? { status } : undefined,
      include: {
        task: {
          include: {
            property: { select: { name: true, roomNumber: true } },
            assignedTo: { select: { name: true } },
          },
        },
      },
      orderBy: { detectedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.missedOrder.findUnique({
      where: { id },
      include: {
        task: {
          include: {
            property: true,
            assignedTo: true,
          },
        },
      },
    });
  }

  async resolve(id: string, resolvedById: string, reason: string) {
    const missedOrder = await this.prisma.missedOrder.findUnique({
      where: { id },
      include: {
        task: {
          include: {
            property: { select: { name: true, roomNumber: true } },
            assignedTo: { select: { name: true } },
          },
        },
      },
    });

    if (!missedOrder) {
      throw new Error('漏单记录不存在');
    }

    const resolved = await this.prisma.missedOrder.update({
      where: { id },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        reason,
      },
    });

    const log = await this.systemLogsService.create({
      entityType: 'MissedOrder',
      entityId: id,
      action: LogAction.COMPLETE,
      reason,
      details: JSON.stringify({
        missedOrderId: id,
        taskId: missedOrder.taskId,
        propertyName: missedOrder.task?.property?.name,
        housekeeper: missedOrder.task?.assignedTo?.name,
        resolvedById,
      }),
      createdById: resolvedById,
    });

    await this.systemLogsService.closeLog(log.id, reason, resolvedById);

    return resolved;
  }
}
