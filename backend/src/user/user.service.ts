import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { role?: Role; search?: string; page?: number; pageSize?: number }) {
    const { role, search, page = 1, pageSize = 20 } = params || {};
    const where: any = {};
    
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { username: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: { username: string; name: string; email?: string; phone?: string; role: Role; avatar?: string }) {
    return this.prisma.user.create({ data });
  }

  async update(id: number, data: { name?: string; email?: string; phone?: string; role?: Role; avatar?: string }) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }

  async getUsersByRole(role: Role) {
    return this.prisma.user.findMany({ where: { role } });
  }
}
