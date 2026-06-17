import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { PropertyStatus, TaskStatus, UserRole, TaskType } from '@rental/db'
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
    userId?: string
    userRole?: UserRole
  }) {
    const { periodType = 'MONTHLY', startDate, endDate, district, managerId, userId, userRole } = params

    const propertyWhere: any = {}
    if (district) propertyWhere.district = district
    if (managerId) propertyWhere.managerId = managerId

    if (userRole && userId) {
      switch (userRole) {
        case UserRole.PROPERTY_MANAGER:
          propertyWhere.managerId = userId
          break
        case UserRole.TENANT:
        case UserRole.MAINTENANCE_WORKER:
        case UserRole.FRONTLINE:
          propertyWhere.id = 'no-access'
          break
      }
    }

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
      by: ['district'],
      _count: true,
      where: propertyWhere,
    })

    const districtStats = []
    for (const item of byDistrict) {
      if (!item.district) continue
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
      where: { ...propertyWhere, NOT: { managerId: null } },
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
    userId?: string
    userRole?: UserRole
  }) {
    const { periodType = 'MONTHLY', startDate, endDate, type, assigneeId, userId, userRole } = params

    const where: any = {}
    if (type) where.type = type
    if (assigneeId) where.assigneeId = assigneeId
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) }
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) }

    if (userRole && userId) {
      switch (userRole) {
        case UserRole.TENANT:
          where.tenant = { userId }
          break
        case UserRole.MAINTENANCE_WORKER:
          where.assigneeId = userId
          where.type = TaskType.MAINTENANCE
          break
        case UserRole.FINANCE:
          where.type = { in: [TaskType.RENT_OVERDUE, TaskType.CONTRACT_REVIEW] }
          break
        case UserRole.FRONTLINE:
          where.assigneeId = userId
          where.type = { in: [TaskType.PROPERTY_LISTING, TaskType.UTILITY_READING, TaskType.MAINTENANCE] }
          break
        case UserRole.PROPERTY_MANAGER:
          where.OR = [
            { creatorId: userId },
            { property: { managerId: userId } },
          ]
          break
        case UserRole.ADMIN:
          break
      }
    }

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
      where: { ...where, NOT: { assigneeId: null } },
    })

    const assigneeStats = []
    for (const item of byAssignee) {
      if (!item.assigneeId) continue
      const user = await this.prisma.user.findUnique({
        where: { id: item.assigneeId },
        select: { id: true, name: true, role: true },
      })
      const completedByUser = await this.prisma.task.count({
        where: { ...where, assigneeId: item.assigneeId, status: TaskStatus.COMPLETED },
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
    userId?: string
    userRole?: UserRole
  }) {
    const { periodType = 'MONTHLY', startDate, endDate, propertyId, tenantId, userId, userRole } = params

    const where: any = { direction: 'INCOME', status: 'PAID' }
    if (propertyId) where.propertyId = propertyId
    if (tenantId) where.tenantId = tenantId
    if (startDate) where.paidAt = { ...where.paidAt, gte: new Date(startDate) }
    if (endDate) where.paidAt = { ...where.paidAt, lte: new Date(endDate) }

    if (userRole && userId) {
      switch (userRole) {
        case UserRole.TENANT:
          where.tenant = { userId }
          break
        case UserRole.PROPERTY_MANAGER:
          where.property = { managerId: userId }
          break
        case UserRole.MAINTENANCE_WORKER:
        case UserRole.FRONTLINE:
          where.id = 'no-access'
          break
        case UserRole.FINANCE:
        case UserRole.ADMIN:
          break
      }
    }

    const incomeRecords = await this.prisma.financeRecord.findMany({
      where,
      orderBy: { paidAt: 'desc' },
    })

    const totalIncome = incomeRecords.reduce((sum, r) => sum + r.amount.toNumber(), 0)

    const expenseWhere: any = { direction: 'EXPENSE', status: 'PAID' }
    if (startDate) expenseWhere.paidAt = { ...expenseWhere.paidAt, gte: new Date(startDate) }
    if (endDate) expenseWhere.paidAt = { ...expenseWhere.paidAt, lte: new Date(endDate) }

    if (userRole && userId) {
      switch (userRole) {
        case UserRole.TENANT:
          expenseWhere.tenant = { userId }
          break
        case UserRole.PROPERTY_MANAGER:
          expenseWhere.property = { managerId: userId }
          break
        case UserRole.MAINTENANCE_WORKER:
        case UserRole.FRONTLINE:
          expenseWhere.id = 'no-access'
          break
        case UserRole.FINANCE:
        case UserRole.ADMIN:
          break
      }
    }

    const expenseRecords = await this.prisma.financeRecord.findMany({
      where: expenseWhere,
    })

    const totalExpense = expenseRecords.reduce((sum, r) => sum + r.amount.toNumber(), 0)

    const byType = await this.prisma.financeRecord.groupBy({
      by: ['type'],
      _sum: { amount: true },
      where,
    })

    const byTypeResult = byType.map((item: any) => ({
      type: item.type,
      _sum: {
        amount: item._sum.amount ? Number(item._sum.amount) : 0,
      },
    }))

    return {
      summary: {
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
      },
      byType: byTypeResult,
    }
  }

  async getMaintenanceReport(params: {
    periodType?: string
    startDate?: string
    endDate?: string
    workerId?: string
    type?: string
    userId?: string
    userRole?: UserRole
  }) {
    const { periodType = 'MONTHLY', startDate, endDate, workerId, type, userId, userRole } = params

    const where: any = {}
    if (workerId) where.workerId = workerId
    if (type) where.record = { type }
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) }
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) }

    if (userRole && userId) {
      switch (userRole) {
        case UserRole.MAINTENANCE_WORKER:
          where.workerId = userId
          break
        case UserRole.PROPERTY_MANAGER:
          where.record = { property: { managerId: userId } }
          break
        case UserRole.TENANT:
        case UserRole.FINANCE:
        case UserRole.FRONTLINE:
          where.id = 'no-access'
          break
        case UserRole.ADMIN:
          break
      }
    }

    const total = await this.prisma.maintenanceWorkOrder.count({ where })

    const byWorker = await this.prisma.maintenanceWorkOrder.groupBy({
      by: ['workerId', 'status'],
      _count: true,
      where: { ...where, NOT: { workerId: null } },
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

  async getDashboardSummary(userId?: string, userRole?: UserRole) {
    const roleKey = userRole ? userRole : 'default'
    const cacheKey = userId ? `dashboard:summary:${userId}:${roleKey}` : `dashboard:summary:${roleKey}`
    const cached = await this.redisService.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    const propertyWhere: any = {}
    const taskWhere: any = {}
    const tenantWhere: any = {}
    const financeWhere: any = { direction: 'INCOME', status: 'PAID' }

    if (userRole && userId) {
      switch (userRole) {
        case UserRole.PROPERTY_MANAGER:
          propertyWhere.managerId = userId
          taskWhere.OR = [
            { creatorId: userId },
            { property: { managerId: userId } },
          ]
          financeWhere.property = { managerId: userId }
          break
        case UserRole.MAINTENANCE_WORKER:
          taskWhere.assigneeId = userId
          taskWhere.type = TaskType.MAINTENANCE
          propertyWhere.id = 'no-access'
          tenantWhere.id = 'no-access'
          break
        case UserRole.FINANCE:
          taskWhere.type = { in: [TaskType.RENT_OVERDUE, TaskType.CONTRACT_REVIEW] }
          propertyWhere.id = 'no-access'
          tenantWhere.id = 'no-access'
          break
        case UserRole.FRONTLINE:
          taskWhere.assigneeId = userId
          taskWhere.type = { in: [TaskType.PROPERTY_LISTING, TaskType.UTILITY_READING, TaskType.MAINTENANCE] }
          propertyWhere.id = 'no-access'
          tenantWhere.id = 'no-access'
          financeWhere.id = 'no-access'
          break
        case UserRole.TENANT:
          taskWhere.tenant = { userId }
          tenantWhere.userId = userId
          propertyWhere.id = 'no-access'
          financeWhere.tenant = { userId }
          break
        case UserRole.ADMIN:
        default:
          break
      }
    }

    const propertyStats = await this.prisma.property.groupBy({
      by: ['status'],
      _count: true,
      where: propertyWhere,
    })

    const taskStats = await this.prisma.task.groupBy({
      by: ['status'],
      _count: true,
      where: taskWhere,
    })

    const totalProperties = await this.prisma.property.count({ where: propertyWhere })
    const occupiedProperties = await this.prisma.property.count({
      where: { ...propertyWhere, status: PropertyStatus.OCCUPIED },
    })

    const totalTasks = await this.prisma.task.count({ where: taskWhere })
    const overdueTasks = await this.prisma.task.count({
      where: {
        ...taskWhere,
        OR: [
          { status: TaskStatus.OVERDUE },
          { status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] }, dueDate: { lt: new Date() } },
        ],
      },
    })

    const totalTenants = await this.prisma.tenant.count({ where: tenantWhere })
    const activeTenants = await this.prisma.tenant.count({
      where: { ...tenantWhere, propertyId: { not: null } },
    })

    const incomeSum = await this.prisma.financeRecord.aggregate({
      _sum: { amount: true },
      where: financeWhere,
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
    const client = this.redisService.getClient()
    const keys = await client.keys('dashboard:summary:*')
    if (keys.length > 0) {
      await client.del(...keys)
    }
    return { success: true, cleared: keys.length }
  }
}
