import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class NotificationService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  onModuleInit() {
    // 可以在这里初始化 Redis 订阅
  }

  async create(data: {
    userId: number;
    title: string;
    content: string;
    type: string;
    relatedId?: number;
    relatedType?: string;
  }) {
    const notification = await this.prisma.notification.create({ data });
    
    // 发布到 Redis 频道，用于实时通知
    await this.redisService.publish(
      `notifications:user:${data.userId}`,
      JSON.stringify(notification),
    );

    return notification;
  }

  async findByUser(userId: number, params?: { isRead?: boolean; page?: number; pageSize?: number }) {
    const { isRead, page = 1, pageSize = 20 } = params || {};
    const where: any = { userId };

    if (isRead !== undefined) where.isRead = isRead;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async markAsRead(id: number) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async notifyRoles(role: string, data: { title: string; content: string; type: string; relatedId?: number; relatedType?: string }) {
    const users = await this.prisma.user.findMany({
      where: { role: role as any },
      select: { id: true },
    });

    const notifications = users.map(user => ({
      userId: user.id,
      ...data,
    }));

    await this.prisma.notification.createMany({ data: notifications });

    // 通知每个用户的 Redis 频道
    for (const user of users) {
      await this.redisService.publish(
        `notifications:user:${user.id}`,
        JSON.stringify({ ...data, userId: user.id }),
      );
    }

    return { count: users.length };
  }
}
