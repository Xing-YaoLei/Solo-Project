import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class CheckInService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  async list(query: {
    activityId?: string;
    orderId?: string;
    status?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { activityId, orderId, status, keyword, page = 1, pageSize = 50 } = query;
    const where: any = {};
    if (activityId) where.activityId = activityId;
    if (orderId) where.orderId = orderId;
    if (status) where.status = status;
    if (keyword) {
      where.OR = [
        { code: { contains: keyword } },
        { customerName: { contains: keyword } },
        { ticketName: { contains: keyword } },
      ];
    }
    const [list, total] = await Promise.all([
      this.prisma.checkInCode.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { order: { select: { orderNo: true, customerPhone: true } } },
      }),
      this.prisma.checkInCode.count({ where }),
    ]);
    return { list, total, page, pageSize };
  }

  async verify(code: string) {
    const cacheKey = `checkin:${code}`;
    const cached = await this.redis.get(cacheKey);
    if (cached === 'USED') {
      throw new BadRequestException('签到码已使用');
    }
    if (cached && cached !== 'USED') {
      return JSON.parse(cached);
    }

    const record = await this.prisma.checkInCode.findUnique({
      where: { code },
      include: { order: { select: { orderNo: true } } },
    });
    if (!record) throw new NotFoundException('签到码不存在');
    if (record.status === 'CHECKED_IN') throw new BadRequestException('该签到码已核销入场');
    if (record.status === 'INVALID') throw new BadRequestException('该签到码已作废');
    if (record.expireAt && new Date() > record.expireAt) throw new BadRequestException('签到码已过期');

    await this.redis.set(cacheKey, JSON.stringify(record), 300);
    return record;
  }

  async checkIn(code: string, operatorId?: string) {
    const record = await this.prisma.checkInCode.findUnique({ where: { code } });
    if (!record) throw new NotFoundException('签到码不存在');
    if (record.status === 'CHECKED_IN') throw new BadRequestException('该签到码已核销入场');
    if (record.status === 'INVALID') throw new BadRequestException('该签到码已作废');

    const updated = await this.prisma.checkInCode.update({
      where: { id: record.id },
      data: {
        status: 'CHECKED_IN',
        checkInAt: new Date(),
        checkInBy: operatorId || null,
      },
      include: { order: true, orderItem: { include: { ticketType: true } } },
    });

    await this.redis.set(`checkin:${code}`, 'USED', 3600);

    const order = updated.order;
    if (order && ['PAID', 'CONFIRMED'].includes(order.status)) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }

    return updated;
  }

  async checkOut(code: string) {
    const record = await this.prisma.checkInCode.findUnique({ where: { code } });
    if (!record) throw new NotFoundException('签到码不存在');
    if (record.status !== 'CHECKED_IN') throw new BadRequestException('只有已入场的签到码才能离场');

    return this.prisma.checkInCode.update({
      where: { id: record.id },
      data: { status: 'CHECKED_OUT', checkOutAt: new Date() },
    });
  }

  async batchStats(activityId: string) {
    const codes = await this.prisma.checkInCode.findMany({ where: { activityId } });
    return {
      total: codes.length,
      pending: codes.filter((c) => c.status === 'PENDING').length,
      checkedIn: codes.filter((c) => c.status === 'CHECKED_IN').length,
      checkedOut: codes.filter((c) => c.status === 'CHECKED_OUT').length,
      expired: codes.filter((c) => c.status === 'EXPIRED').length,
      invalid: codes.filter((c) => c.status === 'INVALID').length,
      rate: codes.length > 0 ? codes.filter((c) => c.status === 'CHECKED_IN').length / codes.length : 0,
    };
  }
}
