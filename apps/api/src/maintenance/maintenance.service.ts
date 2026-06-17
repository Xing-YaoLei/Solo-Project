import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { MaintenanceStatus, Priority } from '@prisma/client'

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  async findAllRecords(params: {
    page?: number
    pageSize?: number
    propertyId?: string
    status?: MaintenanceStatus
    type?: string
  }) {
    const { page = 1, pageSize = 10, propertyId, status, type } = params
    const skip = (page - 1) * pageSize

    const where: any = {}
    if (propertyId) where.propertyId = propertyId
    if (status) where.status = status
    if (type) where.type = type

    const [list, total] = await Promise.all([
      this.prisma.maintenanceRecord.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { id: true, title: true, propertyNo: true, address: true } },
          workOrders: true,
        },
      }),
      this.prisma.maintenanceRecord.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  async findRecord(id: string) {
    const record = await this.prisma.maintenanceRecord.findUnique({
      where: { id },
      include: {
        property: true,
        workOrders: {
          orderBy: { createdAt: 'desc' },
          include: {
            worker: { select: { id: true, name: true, phone: true } },
            creator: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!record) {
      throw new NotFoundException('维修记录不存在')
    }

    return record
  }

  async createRecord(data: any) {
    return this.prisma.maintenanceRecord.create({ data })
  }

  async updateRecord(id: string, data: any) {
    return this.prisma.maintenanceRecord.update({ where: { id }, data })
  }

  async deleteRecord(id: string) {
    return this.prisma.maintenanceRecord.delete({ where: { id } })
  }

  async findWorkOrders(params: {
    page?: number
    pageSize?: number
    recordId?: string
    workerId?: string
    status?: MaintenanceStatus
    priority?: Priority
  }) {
    const { page = 1, pageSize = 10, recordId, workerId, status, priority } = params
    const skip = (page - 1) * pageSize

    const where: any = {}
    if (recordId) where.recordId = recordId
    if (workerId) where.workerId = workerId
    if (status) where.status = status
    if (priority) where.priority = priority

    const [list, total] = await Promise.all([
      this.prisma.maintenanceWorkOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          record: { include: { property: true } },
          worker: { select: { id: true, name: true, phone: true } },
          creator: { select: { id: true, name: true } },
        },
      }),
      this.prisma.maintenanceWorkOrder.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  async findWorkOrder(id: string) {
    const workOrder = await this.prisma.maintenanceWorkOrder.findUnique({
      where: { id },
      include: {
        record: { include: { property: true } },
        worker: true,
        creator: { select: { id: true, name: true } },
      },
    })

    if (!workOrder) {
      throw new NotFoundException('工单不存在')
    }

    return workOrder
  }

  async createWorkOrder(recordId: string, data: any, creatorId: string) {
    return this.prisma.maintenanceWorkOrder.create({
      data: {
        ...data,
        recordId,
        creatorId,
      },
    })
  }

  async updateWorkOrder(id: string, data: any) {
    return this.prisma.maintenanceWorkOrder.update({ where: { id }, data })
  }

  async assignWorker(id: string, workerId: string) {
    return this.prisma.maintenanceWorkOrder.update({
      where: { id },
      data: {
        workerId,
        status: MaintenanceStatus.IN_PROGRESS,
      },
    })
  }

  async completeWorkOrder(id: string, solution: string, cost?: number) {
    return this.prisma.maintenanceWorkOrder.update({
      where: { id },
      data: {
        status: MaintenanceStatus.COMPLETED,
        completedAt: new Date(),
        solution,
        cost,
      },
    })
  }

  async deleteWorkOrder(id: string) {
    return this.prisma.maintenanceWorkOrder.delete({ where: { id } })
  }

  async getStats() {
    const totalRecords = await this.prisma.maintenanceRecord.count()
    const openRecords = await this.prisma.maintenanceRecord.count({
      where: { status: MaintenanceStatus.OPEN },
    })

    const totalOrders = await this.prisma.maintenanceWorkOrder.count()
    const openOrders = await this.prisma.maintenanceWorkOrder.count({
      where: { status: MaintenanceStatus.OPEN },
    })
    const inProgressOrders = await this.prisma.maintenanceWorkOrder.count({
      where: { status: MaintenanceStatus.IN_PROGRESS },
    })

    return {
      records: { total: totalRecords, open: openRecords },
      workOrders: { total: totalOrders, open: openOrders, inProgress: inProgressOrders },
    }
  }

  async getTypes() {
    const types = await this.prisma.maintenanceRecord.findMany({
      select: { type: true },
      distinct: ['type'],
    })
    return types.map((t) => t.type).filter(Boolean)
  }
}
