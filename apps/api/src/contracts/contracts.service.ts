import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ContractStatus } from '@rental/db'

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number
    pageSize?: number
    status?: ContractStatus
    propertyId?: string
    tenantId?: string
    keyword?: string
  }) {
    const { page = 1, pageSize = 10, status, propertyId, tenantId, keyword } = params
    const skip = (page - 1) * pageSize

    const where: any = {}
    if (status) where.status = status
    if (propertyId) where.propertyId = propertyId
    if (tenantId) where.tenantId = tenantId
    if (keyword) {
      where.OR = [
        { contractNo: { contains: keyword } },
        { tenant: { name: { contains: keyword } } },
      ]
    }

    const [list, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { id: true, title: true, propertyNo: true } },
          tenant: { select: { id: true, name: true, phone: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.contract.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        property: true,
        tenant: true,
        createdBy: { select: { id: true, name: true } },
        amendments: { orderBy: { createdAt: 'desc' } },
        tasks: { orderBy: { createdAt: 'desc' } },
        financeRecords: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!contract) {
      throw new NotFoundException('合同不存在')
    }

    return contract
  }

  async create(data: any, creatorId: string) {
    const count = await this.prisma.contract.count()
    const contractNo = `CT${new Date().getFullYear()}${String(count + 1).padStart(4, '0')}`

    return this.prisma.contract.create({
      data: {
        ...data,
        contractNo,
        createdById: creatorId,
      },
    })
  }

  async update(id: string, data: any) {
    return this.prisma.contract.update({
      where: { id },
      data,
    })
  }

  async updateStatus(id: string, status: ContractStatus) {
    return this.prisma.contract.update({
      where: { id },
      data: { status },
    })
  }

  async createVersion(id: string, versionData: any, userId: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id } })
    if (!contract) {
      throw new NotFoundException('合同不存在')
    }

    const newVersion = contract.version + 1

    await this.prisma.contractAmendment.create({
      data: {
        contractId: id,
        version: newVersion,
        changeType: versionData.changeType || 'UPDATE',
        content: versionData.content,
        reason: versionData.reason,
        createdById: userId,
      },
    })

    return this.prisma.contract.update({
      where: { id },
      data: {
        version: newVersion,
        versionNote: versionData.versionNote,
        ...versionData.contractData,
      },
    })
  }

  async delete(id: string) {
    return this.prisma.contract.delete({ where: { id } })
  }

  async getStats() {
    const byStatus = await this.prisma.contract.groupBy({
      by: ['status'],
      _count: true,
    })

    const total = await this.prisma.contract.count()

    return {
      total,
      byStatus,
    }
  }
}
