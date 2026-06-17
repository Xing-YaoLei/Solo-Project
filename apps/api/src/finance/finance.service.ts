import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { TaskType, Priority } from '@rental/db'

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number
    pageSize?: number
    type?: string
    direction?: string
    status?: string
    propertyId?: string
    tenantId?: string
    contractId?: string
    startDate?: string
    endDate?: string
  }) {
    const {
      page = 1,
      pageSize = 10,
      type,
      direction,
      status,
      propertyId,
      tenantId,
      contractId,
      startDate,
      endDate,
    } = params
    const skip = (page - 1) * pageSize

    const where: any = {}
    if (type) where.type = type
    if (direction) where.direction = direction
    if (status) where.status = status
    if (propertyId) where.propertyId = propertyId
    if (tenantId) where.tenantId = tenantId
    if (contractId) where.contractId = contractId
    if (startDate) where.dueDate = { ...where.dueDate, gte: new Date(startDate) }
    if (endDate) where.dueDate = { ...where.dueDate, lte: new Date(endDate) }

    const [list, total] = await Promise.all([
      this.prisma.financeRecord.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { id: true, title: true, propertyNo: true } },
          tenant: { select: { id: true, name: true, phone: true } },
          contract: { select: { id: true, contractNo: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.financeRecord.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  async findOne(id: string) {
    const record = await this.prisma.financeRecord.findUnique({
      where: { id },
      include: {
        property: true,
        tenant: true,
        contract: true,
        createdBy: { select: { id: true, name: true } },
      },
    })

    if (!record) {
      throw new NotFoundException('财务记录不存在')
    }

    return record
  }

  async create(data: any, createdById: string) {
    const count = await this.prisma.financeRecord.count()
    const recordNo = `FIN${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`

    return this.prisma.financeRecord.create({
      data: {
        ...data,
        recordNo,
        createdById,
      },
    })
  }

  async update(id: string, data: any) {
    return this.prisma.financeRecord.update({ where: { id }, data })
  }

  async markPaid(id: string, paidAt?: Date) {
    return this.prisma.financeRecord.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: paidAt || new Date(),
      },
    })
  }

  async delete(id: string) {
    return this.prisma.financeRecord.delete({ where: { id } })
  }

  async getStats() {
    const totalIncome = await this.prisma.financeRecord.aggregate({
      _sum: { amount: true },
      where: { direction: 'INCOME', status: 'PAID' },
    })

    const totalExpense = await this.prisma.financeRecord.aggregate({
      _sum: { amount: true },
      where: { direction: 'EXPENSE', status: 'PAID' },
    })

    const pendingCount = await this.prisma.financeRecord.count({ where: { status: 'PENDING' } })
    const overdueCount = await this.prisma.financeRecord.count({ where: { status: 'OVERDUE' } })

    const byType = await this.prisma.financeRecord.groupBy({
      by: ['type'],
      _sum: { amount: true },
      _count: true,
      where: { direction: 'INCOME', status: 'PAID' },
    })

    return {
      totalIncome: totalIncome._sum.amount?.toNumber() || 0,
      totalExpense: totalExpense._sum.amount?.toNumber() || 0,
      netProfit: (totalIncome._sum.amount?.toNumber() || 0) - (totalExpense._sum.amount?.toNumber() || 0),
      pendingCount,
      overdueCount,
      byType,
    }
  }

  async getTenantFinance(tenantId: string) {
    const records = await this.prisma.financeRecord.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const totalPaid = await this.prisma.financeRecord.aggregate({
      _sum: { amount: true },
      where: { tenantId, direction: 'INCOME', status: 'PAID' },
    })

    const totalUnpaid = await this.prisma.financeRecord.aggregate({
      _sum: { amount: true },
      where: { tenantId, direction: 'INCOME', status: { in: ['PENDING', 'OVERDUE'] } },
    })

    return {
      records,
      totalPaid: totalPaid._sum.amount?.toNumber() || 0,
      totalUnpaid: totalUnpaid._sum.amount?.toNumber() || 0,
    }
  }

  async getTypes() {
    return ['RENT', 'DEPOSIT', 'MAINTENANCE_FEE', 'UTILITY_FEE', 'OTHER']
  }

  async getStatuses() {
    return ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']
  }

  async getSystemUserId(): Promise<string> {
    const admin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    })
    return admin?.id || 'system'
  }

  async checkAndCreateOverdueTasks() {
    const now = new Date()
    const systemUserId = await this.getSystemUserId()

    const overdueRecords = await this.prisma.financeRecord.findMany({
      where: {
        status: { in: ['PENDING', 'OVERDUE'] },
        dueDate: { lt: now },
        type: 'RENT',
      },
      include: {
        tenant: true,
        property: true,
      },
    })

    const results = []

    for (const record of overdueRecords) {
      if (!record.tenantId || !record.propertyId) continue

      const existingTask = await this.prisma.task.findFirst({
        where: {
          tenantId: record.tenantId,
          propertyId: record.propertyId,
          type: TaskType.RENT_OVERDUE,
          status: { in: ['PENDING', 'IN_PROGRESS', 'REASSIGNED', 'OVERDUE'] },
        },
      })

      if (!existingTask) {
        const taskCount = await this.prisma.task.count()
        const taskNo = `TASK${new Date().getFullYear()}${String(taskCount + 1).padStart(6, '0')}`

        const daysOverdue = Math.floor((now.getTime() - new Date(record.dueDate!).getTime()) / (1000 * 60 * 60 * 24))

        const task = await this.prisma.task.create({
          data: {
            taskNo,
            type: TaskType.RENT_OVERDUE,
            title: `租金逾期提醒 - ${record.tenant?.name || '租客'}`,
            description: `租客 ${record.tenant?.name || '未知'} 应付租金 ${record.amount} 元，已逾期 ${daysOverdue} 天。截止日期：${record.dueDate?.toLocaleDateString()}`,
            priority: daysOverdue > 15 ? Priority.URGENT : daysOverdue > 7 ? Priority.HIGH : Priority.MEDIUM,
            dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
            propertyId: record.propertyId,
            tenantId: record.tenantId,
            contractId: record.contractId,
            creatorId: systemUserId,
            formData: {
              financeRecordId: record.id,
              overdueAmount: record.amount,
              overdueDays: daysOverdue,
              originalDueDate: record.dueDate,
            } as any,
          },
        })

        await this.prisma.financeRecord.update({
          where: { id: record.id },
          data: { status: 'OVERDUE' },
        })

        await this.prisma.taskAuditLog.create({
          data: {
            taskId: task.id,
            userId: systemUserId,
            action: 'CREATE',
            toStatus: task.status,
            remark: '系统自动生成租金逾期任务',
          },
        })

        results.push({
          taskId: task.id,
          taskNo: task.taskNo,
          tenantName: record.tenant?.name,
          overdueDays: daysOverdue,
          amount: record.amount,
        })
      }
    }

    return {
      processed: overdueRecords.length,
      created: results.length,
      tasks: results,
    }
  }

  async processRentPayment(recordId: string, paidAt?: Date) {
    const record = await this.prisma.financeRecord.findUnique({
      where: { id: recordId },
      include: { tenant: true },
    })

    if (!record) {
      throw new NotFoundException('财务记录不存在')
    }

    const systemUserId = await this.getSystemUserId()

    const updatedRecord = await this.prisma.financeRecord.update({
      where: { id: recordId },
      data: {
        status: 'PAID',
        paidAt: paidAt || new Date(),
      },
    })

    const relatedTasks = await this.prisma.task.findMany({
      where: {
        tenantId: record.tenantId,
        propertyId: record.propertyId,
        type: TaskType.RENT_OVERDUE,
        status: { in: ['PENDING', 'IN_PROGRESS', 'REASSIGNED', 'OVERDUE'] },
      },
    })

    for (const task of relatedTasks) {
      await this.prisma.task.update({
        where: { id: task.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })

      await this.prisma.taskAuditLog.create({
        data: {
          taskId: task.id,
          userId: systemUserId,
          action: 'STATUS_CHANGE',
          fromStatus: task.status,
          toStatus: 'COMPLETED',
          remark: `租金已支付，自动完成任务。支付金额：${record.amount} 元`,
        },
      })
    }

    return {
      record: updatedRecord,
      completedTasks: relatedTasks.length,
    }
  }
}
