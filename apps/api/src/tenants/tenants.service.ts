import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number
    pageSize?: number
    propertyId?: string
    keyword?: string
  }) {
    const { page = 1, pageSize = 10, propertyId, keyword } = params
    const skip = (page - 1) * pageSize

    const where: any = {}
    if (propertyId) where.propertyId = propertyId
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { phone: { contains: keyword } },
        { idCardNo: { contains: keyword } },
      ]
    }

    const [list, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { id: true, title: true, propertyNo: true, address: true } },
          contracts: { take: 1, orderBy: { createdAt: 'desc' } },
        },
      }),
      this.prisma.tenant.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        property: true,
        user: { select: { id: true, email: true } },
        contracts: { orderBy: { createdAt: 'desc' },
        financeRecords: { orderBy: { createdAt: 'desc' },
        tasks: { orderBy: { createdAt: 'desc' },
      },
    })

    if (!tenant) {
      throw new NotFoundException('租客不存在')
    }

    return tenant
  }

  async create(data: any) {
    return this.prisma.tenant.create({ data })
  }

  async update(id: string, data: any) {
    return this.prisma.tenant.update({ where: { id }, data })
  }

  async delete(id: string) {
    return this.prisma.tenant.delete({ where: { id } })
  }

  async getStats() {
    const total = await this.prisma.tenant.count()
    const active = await this.prisma.tenant.count({
      where: { propertyId: { not: null } },
    })

    return {
      total,
      active,
    }
  }
}
