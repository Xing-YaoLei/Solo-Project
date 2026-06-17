import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { PropertyStatus } from '@prisma/client'

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number
    pageSize?: number
    status?: PropertyStatus
    district?: string
    minPrice?: number
    maxPrice?: number
    bedrooms?: number
    keyword?: string
    managerId?: string
  }) {
    const {
      page = 1,
      pageSize = 10,
      status,
      district,
      minPrice,
      maxPrice,
      bedrooms,
      keyword,
      managerId,
    } = params
    const skip = (page - 1) * pageSize

    const where: any = {}
    if (status) where.status = status
    if (district) where.district = district
    if (minPrice) where.monthlyRent = { ...where.monthlyRent, gte: minPrice }
    if (maxPrice) where.monthlyRent = { ...where.monthlyRent, lte: maxPrice }
    if (bedrooms) where.bedrooms = bedrooms
    if (managerId) where.managerId = managerId
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { address: { contains: keyword } },
        { propertyNo: { contains: keyword } },
      ]
    }

    const [list, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          photos: { take: 1, where: { isCover: true } },
          manager: { select: { id: true, name: true } },
          tenants: { take: 1, select: { id: true, name: true, phone: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        manager: { select: { id: true, name: true, phone: true } },
        creator: { select: { id: true, name: true } },
        tenants: true,
        contracts: { orderBy: { createdAt: 'desc' }, take: 5 },
        maintenanceRecords: { orderBy: { createdAt: 'desc' }, take: 5 },
        utilityRecords: { orderBy: { readingDate: 'desc' }, take: 10 },
        tasks: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })

    if (!property) {
      throw new NotFoundException('房源不存在')
    }

    return property
  }

  async create(data: any, creatorId: string) {
    return this.prisma.property.create({
      data: {
        ...data,
        creatorId,
      },
    })
  }

  async update(id: string, data: any) {
    return this.prisma.property.update({
      where: { id },
      data,
    })
  }

  async updateStatus(id: string, status: PropertyStatus) {
    return this.prisma.property.update({
      where: { id },
      data: { status },
    })
  }

  async delete(id: string) {
    return this.prisma.property.delete({ where: { id } })
  }

  async uploadPhoto(propertyId: string, photoData: any) {
    const photo = await this.prisma.propertyPhoto.create({
      data: {
        propertyId,
        ...photoData,
      },
    })
    return photo
  }

  async updatePhoto(id: string, data: any) {
    return this.prisma.propertyPhoto.update({
      where: { id },
      data,
    })
  }

  async deletePhoto(id: string) {
    return this.prisma.propertyPhoto.delete({ where: { id } })
  }

  async setCoverPhoto(propertyId: string, photoId: string) {
    await this.prisma.propertyPhoto.updateMany({
      where: { propertyId, isCover: true },
      data: { isCover: false },
    })
    return this.prisma.propertyPhoto.update({
      where: { id: photoId },
      data: { isCover: true },
    })
  }

  async getStats() {
    const byStatus = await this.prisma.property.groupBy({
      by: ['status'],
      _count: true,
      _avg: { monthlyRent: true },
    })

    const total = await this.prisma.property.count()
    const occupied = await this.prisma.property.count({ where: { status: PropertyStatus.OCCUPIED } })
    const vacant = await this.prisma.property.count({ where: { status: PropertyStatus.VACANT } })

    return {
      total,
      occupied,
      vacant,
      occupancyRate: total > 0 ? (occupied / total) * 100 : 0,
      byStatus,
    }
  }

  async getFilters() {
    const districts = await this.prisma.property.findMany({
      select: { district: true },
      distinct: ['district'],
      where: { district: { not: null } },
    })

    const priceRanges = [
      { label: '3000以下', min: 0, max: 3000 },
      { label: '3000-5000', min: 3000, max: 5000 },
      { label: '5000-8000', min: 5000, max: 8000 },
      { label: '8000以上', min: 8000, max: null },
    ]

    return {
      districts: districts.map((d) => d.district),
      priceRanges,
      statuses: Object.values(PropertyStatus),
      bedrooms: [1, 2, 3, 4],
    }
  }
}
