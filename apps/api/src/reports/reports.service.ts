import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { PropertyStatus, TaskStatus } from '@prisma/client'
import { RedisService } from '../redis/redis.service'

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async getOccupancyReport(params: {
    periodType?: string
    startDate?: string
    endDate?: string
    district?: string
    managerId?: string
  }) {
    const { periodType = 'MONTHLY', startDate, endDate, district, managerId } = params

    const propertyWhere: any = {}
    if (district) propertyWhere.district = district
    if (managerId) propertyWhere.managerId = managerId

    const totalProperties = await this.prisma.property.count({ where: propertyWhere })
    const occupiedProperties = await this.prisma.property.count({
      where: { ...propertyWhere, status: PropertyStatus.OCCUPIED },
    })
    const vacantProperties = await this.prisma.property.count({
      where: { ...propertyWhere, status: PropertyStatus.VACANT },
    })
    const maintenanceProperties = await this.prisma.property.count({
      where: { ...propertyWhere, status: PropertyStatus.MAINTENANCE },
    })

    const byDistrict = await this.prisma.property.groupBy({
      by: ['district',
      _count: true,
      where: { ...propertyWhere, district: { not: null },
    })

    const districtStats = []
    for (const item of byDistrict) {
      const districtOccupied = await this.prisma.property.count({
        where: {
          ...propertyWhere,
          district: item.district,
          status: PropertyStatus.OCCUPIED,
        },
      })
      districtStats.push({
        district: item.district,
        total: item._count,
        occupied: districtOccupied,
        occupancyRate: item._count > 0 ? (districtOccupied / item._count) * 100 : 0,
      })
    }

    const byManager = await this.prisma.property.groupBy({
      by: ['managerId'],
      _count: true,
      where: { ...propertyWhere, managerId: { not: null } },
    })

    const managerStats = []
    for (const item of byManager) {
      if (!item.managerId) continue
      const manager = await this.prisma.user.findUnique({
        where: { id: item.managerId },
        select: { id: true, name: true },
      })
      const managerOccupied = await this.prisma.property.count({
        where: {
          ...propertyWhere,
          managerId: item.managerId,
          status: PropertyStatus.OCCUPIED,
        },
      })
      managerStats.push({
        manager,
        total: item._count,
        occupied: managerOccupied,
        occupancyRate: item._count > 0 ? (managerOccupied / item._count) * 100 : 0,
      })
    }

    return {
      summary: {
        total: totalProperties,
        occupied: occupiedProperties,
        vacant: vacantProperties,
        maintenance: maintenanceProperties,
        occupancyRate: totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0,
      },
      byDistrict: districtStats,
      byManager: managerStats,
    }
  }

  async getTaskReport(params: {
    periodType?: string
    startDate?: string
    endDate?: string
    type?: string
    assigneeId?: string
  }) {
    const { periodType = 'MONTHLY', startDate, endDate, type, assigneeId } = params

    const where: any = {}
    if (type) where.type = type
    if (assigneeId) where.assigneeId = assigneeId
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) }
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) }

    const total = await this.prisma.task.count({ where })
    const completed = await this.prisma.task.count({
      where: { ...where, status: TaskStatus.COMPLETED },
    })
    const pending = await this.prisma.task.count({
      where: { ...where, status: TaskStatus.PENDING },
    })
    const inProgress = await this.prisma.task.count({
      where: { ...where, status: TaskStatus.IN_PROGRESS },
    })
    const overdue = await this.prisma.task.count({
      where: {
        ...where,
        OR: [
          { status: TaskStatus.OVERDUE },
          { status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] }, dueDate: { lt: new Date() } },
        ],
      },
    })

    const byType = await this.prisma.task.groupBy({
      by: ['type'],
      _count: true,
      where,
    })

    const byStatus = await this.prisma.task.groupBy({
      by: ['status'],
      _count: true,
      where,
    })

    const byAssignee = await this.prisma.task.groupBy({
      by: ['assigneeId'],
      _count: true,
      where: { ...where, assigneeId: { not: null } },
    })

    const assigneeStats = []
    for (const item of byAssignee) {
      if (!item.assigneeId) continue
      const user = await this.prisma.user.findUnique({
        where: { id: item.assigneeId },
        select: { id: true, name: true, role: true },
      })
      const completedByUser = await this.prisma.task.count({
        where: { assigneeId: item.assigneeId, status: TaskStatus.COMPLETED },
      })
      assigneeStats.push({
          assignee: user,
          total: item._count,
          completed: completedByUser,
          completionRate: item._count > 0 ? (completedByUser / item._count) * 100 : 0,
        })
    }

    return {
      summary: {
        total,
        completed,
        pending,
        inProgress,
        overdue,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
      },
      byType,
      byStatus,
      byAssignee: assigneeStats,
    }
  }

  async getRevenueReport(params: {
    periodType?: string
    startDate?: string
    endDate?: string
    propertyId?: string
    tenantId?: string
  }) {
    const { periodType = 'MONTHLY', startDate, endDate, propertyId, tenantId } = params

    const where: any = { direction: 'INCOME', status: 'PAID' }
    if (propertyId) where.propertyId = propertyId
    if (tenantId) where.tenantId = tenantId
    if (startDate) where.paidAt = { ...where.paidAt, gte: new Date(startDate) }
    if (endDate) where.paidAt = { ...where.paidAt, lte: new Date(endDate) }

    const incomeRecords = await this.prisma.financeRecord.findMany({
      where,
      orderBy: { paidAt: 'desc' },
    })

    const totalIncome = incomeRecords.reduce((sum, r) => sum + r.amount.toNumber(), 0)

    const expenseWhere: any = { direction: 'EXPENSE', status: 'PAID' }
    if (startDate) expenseWhere.paidAt = { ...expenseWhere.paidAt, gte: new Date(startDate) }
    if (endDate) expenseWhere.paidAt = { ...expenseWhere.paidAt, lte: new Date(endDate) }

    const expenseRecords = await this.prisma.financeRecord.findMany({
      where: expenseWhere,
    })

    const totalExpense = expenseRecords.reduce((sum, r) => sum + r.amount.toNumber(), 0)

    const byType = await this.prisma.financeRecord.groupBy({
      by: ['type'],
      _sum: { amount: true },
      where,
    })

    return {
      summary: {
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
      },
      byType,
    }
  }

  async getMaintenanceReport(params: {
    periodType?: string
    startDate?: string
    endDate?: string
    workerId?: string
    type?: string
  }) {
    const { periodType = 'MONTHLY', startDate, endDate, workerId, type } = params

    const where: any = {}
    if (workerId) where.workerId = workerId
    if (type) where.record = { type }
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) }
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) }

    const total = await this.prisma.maintenanceWorkOrder.count({ where })

    const byWorker = await this.prisma.maintenanceWorkOrder.groupBy({
      by: ['workerId', 'status'],
      _count: true,
      where: { ...where, workerId: { not: null } },
    })

    const workerStatsMap = new Map()
    for (const item of byWorker) {
      if (!item.workerId) continue
      if (!workerStatsMap.has(item.workerId)) {
        workerStatsMap.set(item.workerId, { total: 0, completed: 0, inProgress: 0, open: 0 })
      }
      const stats = workerStatsMap.get(item.workerId)
      stats.total += item._count
      if (item.status === 'COMPLETED') stats.completed += item._count
      if (item.status === 'IN_PROGRESS') stats.inProgress += item._count
      if (item.status === 'OPEN') stats.open += item._count
    }

    const workerStats = []
    for (const [workerId, stats] of workerStatsMap) {
      const worker = await this.prisma.user.findUnique({
        where: { id: workerId },
        select: { id: true, name: true },
      })
      workerStats.push({
        worker,
        ...stats,
        completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      })
    }

    const totalCost = await this.prisma.maintenanceWorkOrder.aggregate({
      _sum: { cost: true },
      where: { ...where, status: 'COMPLETED' },
    })

    return {
      summary: {
        total,
        totalCost: totalCost._sum.cost?.toNumber() || 0,
      },
      byWorker: workerStats,
    }
  }

  async getDashboardSummary() {
    const cacheKey = 'dashboard:summary'
    const cached = await this.redisService.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    const [propertyStats = await this.prisma.property.groupBy({
      by: ['status'],
      _count: true,
    })

    const taskStats = await this.prisma.task.groupBy({
      by: ['status'],
      _count: true,
    })

    const totalProperties = await this.prisma.property.count()
    const occupiedProperties = await this.prisma.property.count({
      where: { status: PropertyStatus.OCCUPIED },
    })

    const totalTasks = await this.prisma.task.count()
    const overdueTasks = await this.prisma.task.count({
      where: {
        OR: [
          { status: TaskStatus.OVERDUE },
          { status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] }, dueDate: { lt: new Date() }, dueDate: { not: null } },
        ],
      },
    })

    const totalTenants = await this.prisma.tenant.count()
    const activeTenants = await this.prisma.tenant.count({
      where: { propertyId: { not: null } },
    })

    const incomeSum = await this.prisma.financeRecord.aggregate({
      _sum: { amount: true },
      where: { direction: 'INCOME', status: 'PAID' },
    })

    const result = {
      properties: {
        total: totalProperties,
        occupied: occupiedProperties,
        occupancyRate: totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0,
        byStatus: propertyStats,
      },
      tasks: {
        total: totalTasks,
        overdue: overdueTasks,
        byStatus: taskStats,
      },
      tenants: {
        total: totalTenants,
        active: activeTenants,
      },
      finance: {
        totalIncome: incomeSum._sum.amount?.toNumber() || 0,
      },
    }

    await this.redisService.set(cacheKey, JSON.stringify(result), 300)

    return result
  }

  async clearDashboardCache() {
    await this.redisService.del('dashboard:summary')
    return { success: true }
  }
}
