import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(role?: UserRole) {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        assignedTasks: true,
        notifications: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async create(data: {
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    avatar?: string;
  }) {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: {
    name?: string;
    phone?: string;
    role?: UserRole;
    avatar?: string;
  }) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async findByRole(role: UserRole) {
    return this.prisma.user.findMany({
      where: { role },
    });
  }
}
