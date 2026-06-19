import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationType, NotificationStatus, UserRole } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async findAll(userId: string, status?: NotificationStatus) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        status,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findOne(id: string) {
    return this.prisma.notification.findUnique({
      where: { id },
    });
  }

  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    content: string;
    relatedId?: string;
    relatedType?: string;
  }) {
    const notification = await this.prisma.notification.create({ data });
    
    await this.redisService.publish(
      `notifications:${data.userId}`,
      JSON.stringify(notification),
    );

    return notification;
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, status: NotificationStatus.UNREAD },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, status: NotificationStatus.UNREAD },
    });
  }

  async notifyRoles(
    roles: UserRole[],
    type: NotificationType,
    title: string,
    content: string,
    relatedId?: string,
    relatedType?: string,
  ) {
    const users = await this.prisma.user.findMany({
      where: { role: { in: roles } },
      select: { id: true },
    });

    const notifications = [];
    for (const user of users) {
      const notification = await this.create({
        userId: user.id,
        type,
        title,
        content,
        relatedId,
        relatedType,
      });
      notifications.push(notification);
    }

    return notifications;
  }
}
