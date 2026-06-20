import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SponsorService {
  constructor(private prisma: PrismaService) {}

  async list(activityId?: string) {
    return this.prisma.sponsor.findMany({
      where: activityId ? { activityId } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    return this.prisma.sponsor.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.sponsor.create({ data });
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.sponsor.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('赞助商不存在');
    return this.prisma.sponsor.update({ where: { id }, data });
  }

  async remove(id: string) {
    const existing = await this.prisma.sponsor.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('赞助商不存在');
    return this.prisma.sponsor.delete({ where: { id } });
  }

  async summaryByActivity(activityId: string) {
    const sponsors = await this.prisma.sponsor.findMany({ where: { activityId } });
    const totalAmount = sponsors.reduce((s, sp) => s + (sp.amount?.toNumber() || 0), 0);
    const typeCount: Record<string, number> = {};
    sponsors.forEach((s) => {
      typeCount[s.type] = (typeCount[s.type] || 0) + 1;
    });
    return { sponsors, totalAmount, typeCount, count: sponsors.length };
  }
}
