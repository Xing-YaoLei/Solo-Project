import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UserRole } from '@rental/db'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number
    pageSize?: number
    role?: UserRole
    keyword?: string
  }) {
    const { page = 1, pageSize = 10, role, keyword } = params
    const skip = (page - 1) * pageSize

    const where: any = {}
    if (role) where.role = role
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { email: { contains: keyword } },
        { phone: { contains: keyword } },
      ]
    }

    const [list, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          avatar: true,
          department: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        department: true,
        createdAt: true,
      },
    })
  }

  async getUsersByRole(role: UserRole) {
    return this.prisma.user.findMany({
      where: { role },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      orderBy: { name: 'asc' },
    })
  }

  async update(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        department: true,
      },
    })
  }

  async getStats() {
    const byRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: true,
    })

    return {
      total: await this.prisma.user.count(),
      byRole,
    }
  }
}
