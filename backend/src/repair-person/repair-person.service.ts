import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RepairPersonService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { status?: string; skill?: string }) {
    const where: any = {};
    if (params?.status) where.status = params.status;
    if (params?.skill) where.skill = { contains: params.skill };

    return this.prisma.repairPerson.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.repairPerson.findUnique({
      where: { id },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async create(data: any) {
    return this.prisma.repairPerson.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.repairPerson.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.prisma.repairPerson.delete({ where: { id } });
    return { success: true };
  }

  async getStats(personId: string, startDate?: string, endDate?: string) {
    const where: any = {
      assignPersonId: personId,
    };

    if (startDate) where.createdAt = { ...(where.createdAt || {}), gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...(where.createdAt || {}), lte: new Date(endDate) };

    const [total, completed, onTime, delayed] = await Promise.all([
      this.prisma.repairOrder.count({ where }),
      this.prisma.repairOrder.count({
        where: { ...where, status: 'CLOSED' },
      }),
      this.prisma.repairOrder.count({
        where: { ...where, status: 'CLOSED', isOnTime: true },
      }),
      this.prisma.repairOrder.count({
        where: { ...where, delayRecords: { some: {} } },
      }),
    ]);

    const onTimeRate = completed > 0 ? Math.round((onTime / completed) * 100) : 0;

    return {
      total,
      completed,
      onTime,
      delayed,
      onTimeRate,
    };
  }
}
