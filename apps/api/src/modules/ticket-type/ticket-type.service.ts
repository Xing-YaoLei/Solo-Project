import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StatusHistoryService } from '../../common/status-history/status-history.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class TicketTypeService {
  constructor(
    private prisma: PrismaService,
    private history: StatusHistoryService,
    private redis: RedisService,
  ) {}

  async list(activityId?: string) {
    const cacheKey = `tickettypes:${activityId || 'all'}`;
    const cached = await this.redis.getJson<any[]>(cacheKey);
    if (cached) return cached;

    const data = await this.prisma.ticketType.findMany({
      where: activityId ? { activityId } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    await this.redis.setJson(cacheKey, data, 60);
    return data;
  }

  async findOne(id: string) {
    return this.prisma.ticketType.findUnique({ where: { id } });
  }

  async create(data: any) {
    const result = await this.prisma.ticketType.create({ data });
    await this.redis.del(`tickettypes:${data.activityId || 'all'}`);
    await this.history.record({
      entityType: 'TicketType',
      entityId: result.id,
      toStatus: result.status,
      activityId: data.activityId,
      ticketTypeId: result.id,
      changeNote: '创建票种',
    });
    return result;
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.ticketType.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('票种不存在');

    if (data.status && data.status !== existing.status) {
      await this.history.record({
        entityType: 'TicketType',
        entityId: id,
        fromStatus: existing.status,
        toStatus: data.status,
        activityId: existing.activityId,
        ticketTypeId: id,
        changeNote: `状态变更为 ${data.status}`,
        changeReason: data.statusReason || null,
      });
    }

    const { statusReason, ...rest } = data;
    const result = await this.prisma.ticketType.update({ where: { id }, data: rest });
    await this.redis.del(`tickettypes:${existing.activityId}`);
    return result;
  }

  async remove(id: string) {
    const existing = await this.prisma.ticketType.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('票种不存在');
    if (existing.soldCount > 0) throw new BadRequestException('已有销售记录的票种不能删除');

    await this.redis.del(`tickettypes:${existing.activityId}`);
    return this.prisma.ticketType.delete({ where: { id } });
  }

  async listHistory(id: string) {
    return this.history.query('TicketType', id);
  }
}
