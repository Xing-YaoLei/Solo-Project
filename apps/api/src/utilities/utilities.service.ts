import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UtilitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number
    pageSize?: number
    propertyId?: string
    type?: string
    startDate?: string
    endDate?: string
  }) {
    const { page = 1, pageSize = 10, propertyId, type, startDate, endDate } = params
    const skip = (page - 1) * pageSize

    const where: any = {}
    if (propertyId) where.propertyId = propertyId
    if (type) where.type = type
    if (startDate) where.readingDate = { ...where.readingDate, gte: new Date(startDate) }
    if (endDate) where.readingDate = { ...where.readingDate, lte: new Date(endDate) }

    const [list, total] = await Promise.all([
      this.prisma.utilityReading.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { readingDate: 'desc' },
        include: {
          property: { select: { id: true, title: true, propertyNo: true } },
          recordedBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.utilityReading.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  async findOne(id: string) {
    return this.prisma.utilityReading.findUnique({
      where: { id },
      include: {
        property: true,
        recordedBy: { select: { id: true, name: true } },
      },
    })
  }

  async create(data: any, recordedById: string) {
    const propertyId = data.propertyId
    const type = data.type

    const lastReading = await this.prisma.utilityReading.findFirst({
      where: { propertyId, type },
      orderBy: { readingDate: 'desc' },
    })

    const previousReading = lastReading ? lastReading.reading : data.previousReading
    const usage = previousReading ? data.reading - previousReading : null

    return this.prisma.utilityReading.create({
      data: {
        ...data,
        previousReading,
        usage,
        recordedById,
      },
    })
  }

  async update(id: string, data: any) {
    return this.prisma.utilityReading.update({ where: { id }, data })
  }

  async delete(id: string) {
    return this.prisma.utilityReading.delete({ where: { id } })
  }

  async getPropertyReadings(propertyId: string, type?: string, months?: number) {
    const limit = months || 12
    const where: any = { propertyId }
    if (type) where.type = type

    return this.prisma.utilityReading.findMany({
      where,
      orderBy: { readingDate: 'desc' },
      take: limit,
    })
  }

  async getStats() {
    const total = await this.prisma.utilityReading.count()
    const thisMonth = await this.prisma.utilityReading.count({
      where: {
        readingDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    })

    return { total, thisMonth }
  }

  async getTypes() {
    return ['WATER', 'ELECTRIC', 'GAS']
  }
}
