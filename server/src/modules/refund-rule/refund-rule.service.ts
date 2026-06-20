import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '../../prisma';
import { CreateRefundRuleDto, UpdateRefundRuleDto, FilterRefundRuleDto } from './refund-rule.dto';

@Injectable()
export class RefundRuleService {
  async create(dto: CreateRefundRuleDto) {
    return prisma.refundRule.create({ data: dto });
  }

  async findAll(filter: FilterRefundRuleDto) {
    const where: Record<string, unknown> = {};
    if (filter.isActive !== undefined) where.isActive = filter.isActive;
    if (filter.ticketTypeId) where.ticketTypeId = filter.ticketTypeId;

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.refundRule.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.refundRule.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const rule = await prisma.refundRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException(`RefundRule ${id} not found`);
    return rule;
  }

  async update(id: string, dto: UpdateRefundRuleDto) {
    await this.findOne(id);
    return prisma.refundRule.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.refundRule.update({ where: { id }, data: { isActive: false } });
  }
}
