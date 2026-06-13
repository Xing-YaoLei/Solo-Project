import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    role?: UserRole;
    region?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const { page = 1, pageSize = 20, ...filters } = params;
    const where: any = {};

    if (filters.role !== undefined) where.role = filters.role;
    if (filters.region) where.region = filters.region;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: 'asc' },
      }),
    ]);

    return { total, page, pageSize, items };
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getOperators() {
    return this.prisma.user.findMany({
      where: { role: { in: [UserRole.OPERATOR, UserRole.MANAGER, UserRole.ADMIN] }, isActive: true },
      select: { id: true, name: true, role: true, region: true },
      orderBy: { name: 'asc' },
    });
  }

  async getRegions() {
    const result = await this.prisma.user.findMany({
      where: { region: { not: null }, isActive: true },
      select: { region: true },
      distinct: ['region'],
    });
    return result.map((r) => r.region).filter(Boolean);
  }

  async create(data: {
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    region?: string;
  }) {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: Partial<{ name: string; email: string; phone?: string; role: UserRole; region?: string; isActive: boolean }>) {
    return this.prisma.user.update({ where: { id }, data });
  }
}
