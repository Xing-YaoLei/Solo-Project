import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateNotificationDto, SendTemplatedNotificationDto, MarkReadDto } from './dto';
import { PaginationDto, createPaginatedResult, PaginatedResult } from '@/common/dto/pagination.dto';
import { NotificationType, NotificationTemplate } from '@prisma/client';

const notificationSelectFields = {
  id: true,
  type: true,
  title: true,
  content: true,
  isRead: true,
  readAt: true,
  createdAt: true,
  actionType: true,
  actionUrl: true,
  taskId: true,
  evidenceId: true,
  recipient: {
    select: {
      id: true,
      username: true,
      fullName: true,
    },
  },
  task: {
    select: {
      id: true,
      taskNo: true,
      title: true,
    },
  },
  evidence: {
    select: {
      id: true,
      evidenceNo: true,
      title: true,
    },
  },
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: createDto,
      select: notificationSelectFields,
    });

    this.logger.log(`创建通知: ${notification.title} -> 用户${notification.recipient.id}`);
    return notification;
  }

  async sendTemplated(sendDto: SendTemplatedNotificationDto) {
    let template;
    if (sendDto.templateId) {
      template = await this.prisma.notificationTemplate.findUnique({
        where: { id: sendDto.templateId },
      });
    } else if (sendDto.templateCategory) {
      template = await this.prisma.notificationTemplate.findFirst({
        where: {
          category: sendDto.templateCategory,
          isActive: true,
        },
        orderBy: { version: 'desc' },
      });
    }

    if (!template) {
      throw new HttpException('通知模板不存在或未启用', HttpStatus.NOT_FOUND);
    }

    const subject = this.replaceVariables(template.subject, sendDto.variables);
    const content = this.replaceVariables(template.content, sendDto.variables);

    const notificationTypeMap: Record<string, NotificationType> = {
      TASK_ASSIGN: NotificationType.TASK_ASSIGNED,
      REVIEW_REMINDER: NotificationType.EVIDENCE_REVIEW_NEEDED,
      SUPPLEMENT_REMINDER: NotificationType.SUPPLEMENT_REQUESTED,
    };

    const type = notificationTypeMap[template.category] || NotificationType.SYSTEM;

    const created = await Promise.all(
      sendDto.recipientIds.map((recipientId) =>
        this.prisma.notification.create({
          data: {
            type,
            title: subject,
            content,
            recipientId,
            taskId: sendDto.taskId,
            evidenceId: sendDto.evidenceId,
          },
          select: notificationSelectFields,
        }),
      ),
    );

    this.logger.log(`按模板发送通知: ${template.name} -> ${sendDto.recipientIds.length}个用户`);
    return { message: '发送成功', sentCount: created.length };
  }

  private replaceVariables(text: string, variables?: Record<string, any>): string {
    if (!variables) return text;
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  async findByUser(
    userId: string,
    pagination: PaginationDto,
    filters?: {
      type?: NotificationType;
      isRead?: boolean;
    },
  ): Promise<PaginatedResult<any>> {
    const { skip, take, sortBy, sortOrder } = pagination;

    const where: any = { recipientId: userId };
    if (filters?.type) where.type = filters.type;
    if (filters?.isRead !== undefined) where.isRead = filters.isRead;

    const [total, data] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: notificationSelectFields,
      }),
    ]);

    return createPaginatedResult(data, total, pagination.page, pagination.pageSize);
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });
    return { unreadCount: count };
  }

  async markRead(userId: string, markReadDto: MarkReadDto) {
    const where: any = { recipientId: userId, isRead: false };
    if (markReadDto.ids && markReadDto.ids.length > 0) {
      where.id = { in: markReadDto.ids };
    }

    const result = await this.prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    this.logger.log(`标记通知已读: 用户${userId} 数量${result.count}`);
    return { markedCount: result.count };
  }

  async findAll(
    pagination: PaginationDto,
    filters?: {
      type?: NotificationType;
      recipientId?: string;
      isRead?: boolean;
      taskId?: string;
    },
  ): Promise<PaginatedResult<any>> {
    const { skip, take, sortBy, sortOrder } = pagination;

    const where: any = {};
    if (filters?.type) where.type = filters.type;
    if (filters?.recipientId) where.recipientId = filters.recipientId;
    if (filters?.isRead !== undefined) where.isRead = filters.isRead;
    if (filters?.taskId) where.taskId = filters.taskId;

    const [total, data] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: notificationSelectFields,
      }),
    ]);

    return createPaginatedResult(data, total, pagination.page, pagination.pageSize);
  }

  async remove(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new HttpException('通知不存在', HttpStatus.NOT_FOUND);
    }
    if (notification.recipientId !== userId) {
      throw new HttpException('无权删除此通知', HttpStatus.FORBIDDEN);
    }

    await this.prisma.notification.delete({ where: { id } });
    return { message: '通知已删除' };
  }

  async createTemplate(
    data: Partial<NotificationTemplate> & {
      name: string;
      category: string;
      subject: string;
      content: string;
      createdById: string;
    },
  ) {
    const existing = await this.prisma.notificationTemplate.findFirst({
      where: { category: data.category },
      orderBy: { version: 'desc' },
    });
    const version = existing ? existing.version + 1 : 1;

    return this.prisma.notificationTemplate.create({
      data: { ...data, version },
    });
  }

  async findTemplates(
    pagination: PaginationDto,
    filters?: { category?: string; isActive?: boolean },
  ) {
    const { skip, take, sortBy, sortOrder } = pagination;
    const where: any = {};
    if (filters?.category) where.category = filters.category;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const [total, data] = await Promise.all([
      this.prisma.notificationTemplate.count({ where }),
      this.prisma.notificationTemplate.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: { createdBy: { select: { fullName: true } } },
      }),
    ]);

    return createPaginatedResult(data, total, pagination.page, pagination.pageSize);
  }

  async findOneTemplate(id: string) {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id },
      include: { createdBy: { select: { fullName: true } } },
    });
    if (!template) {
      throw new HttpException('模板不存在', HttpStatus.NOT_FOUND);
    }
    return template;
  }

  async updateTemplate(
    id: string,
    data: Partial<NotificationTemplate> & {
      name?: string;
      category?: string;
      subject?: string;
      content?: string;
      variables?: string[];
      isActive?: boolean;
    },
  ) {
    const existing = await this.prisma.notificationTemplate.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new HttpException('模板不存在', HttpStatus.NOT_FOUND);
    }

    let version = existing.version;
    if (data.category && data.category !== existing.category) {
      const categoryLatest = await this.prisma.notificationTemplate.findFirst({
        where: { category: data.category },
        orderBy: { version: 'desc' },
      });
      version = categoryLatest ? categoryLatest.version + 1 : 1;
    }

    const updated = await this.prisma.notificationTemplate.update({
      where: { id },
      data: { ...data, version },
      include: { createdBy: { select: { fullName: true } } },
    });

    this.logger.log(`更新模板: ${updated.name}`);
    return updated;
  }

  async deleteTemplate(id: string) {
    const existing = await this.prisma.notificationTemplate.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new HttpException('模板不存在', HttpStatus.NOT_FOUND);
    }

    await this.prisma.notificationTemplate.delete({ where: { id } });
    this.logger.log(`删除模板: ${existing.name}`);
    return { message: '模板已删除' };
  }
}
