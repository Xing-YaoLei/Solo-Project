import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { TaskStatus, TaskType, Priority } from '@prisma/client'
import { RedisService } from '../redis/redis.service'

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async findAll(params: {
    page?: number
    pageSize?: number
    type?: TaskType
    status?: TaskStatus
    priority?: Priority
    assigneeId?: string
    creatorId?: string
    propertyId?: string
    tenantId?: string
    keyword?: string
    pool?: string
  }) {
    const {
      page = 1,
      pageSize = 10,
      type,
      status,
      priority,
      assigneeId,
      creatorId,
      propertyId,
      tenantId,
      keyword,
      pool,
    } = params
    const skip = (page - 1) * pageSize

    const where: any = {}
    if (type) where.type = type
    if (status) where.status = status
    if (priority) where.priority = priority
    if (assigneeId) where.assigneeId = assigneeId
    if (creatorId) where.creatorId = creatorId
    if (propertyId) where.propertyId = propertyId
    if (tenantId) where.tenantId = tenantId
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { description: { contains: keyword } },
        { taskNo: { contains: keyword } },
      ]
    }

    if (pool === 'overdue') {
      where.OR = [
        { status: TaskStatus.OVERDUE },
        {
          status: TaskStatus.PENDING,
          dueDate: { lt: new Date() },
        },
      ]
    }

    const [list, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          property: { select: { id: true, title: true, propertyNo: true, address: true } },
          assignee: { select: { id: true, name: true, role: true, avatar: true } },
          creator: { select: { id: true, name: true } },
          tenant: { select: { id: true, name: true, phone: true } },
          contract: { select: { id: true, contractNo: true } },
          comments: { take: 3, orderBy: { createdAt: 'desc' } },
        },
      }),
      this.prisma.task.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        property: true,
        assignee: { select: { id: true, name: true, role: true, phone: true, avatar: true } },
        creator: { select: { id: true, name: true } },
        tenant: true,
        contract: true,
        parentTask: { select: { id: true, title: true, status: true } },
        childTasks: { orderBy: { createdAt: 'desc' } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    })

    if (!task) {
      throw new NotFoundException('任务不存在')
    }

    return task
  }

  async create(data: any, creatorId: string) {
    const count = await this.prisma.task.count()
    const taskNo = `TASK${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`

    const task = await this.prisma.task.create({
      data: {
        ...data,
        taskNo,
        creatorId,
      },
    })

    await this.createAuditLog(task.id, creatorId, 'CREATE', null, task.status, '创建任务')

    if (data.assigneeId) {
      await this.incrementUserTaskCount(data.assigneeId)
    }

    return task
  }

  async update(id: string, data: any, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id } })
    if (!task) {
      throw new NotFoundException('任务不存在')
    }

    const oldStatus = task.status
    const updated = await this.prisma.task.update({ where: { id }, data })

    if (data.status && data.status !== oldStatus) {
      await this.createAuditLog(id, userId, 'STATUS_CHANGE', oldStatus, data.status, '状态变更')
    }

    return updated
  }

  async updateStatus(id: string, status: TaskStatus, userId: string, remark?: string) {
    const task = await this.prisma.task.findUnique({ where: { id } })
    if (!task) {
      throw new NotFoundException('任务不存在')
    }

    const oldStatus = task.status

    const data: any = { status }
    if (status === TaskStatus.COMPLETED) {
      data.completedAt = new Date()
    }

    const updated = await this.prisma.task.update({ where: { id }, data })

    await this.createAuditLog(id, userId, 'STATUS_CHANGE', oldStatus, status, remark || '状态变更')

    if (task.assigneeId) {
      if (status === TaskStatus.COMPLETED || status === TaskStatus.REJECTED) {
        await this.decrementUserTaskCount(task.assigneeId)
      }
    }

    return updated
  }

  async assign(id: string, assigneeId: string, userId: string, remark?: string) {
    const task = await this.prisma.task.findUnique({ where: { id } })
    if (!task) {
      throw new NotFoundException('任务不存在')
    }

    const oldAssignee = task.assigneeId

    if (oldAssignee && oldAssignee !== assigneeId) {
      await this.decrementUserTaskCount(oldAssignee)
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        assigneeId,
        status: TaskStatus.IN_PROGRESS,
      },
    })

    await this.incrementUserTaskCount(assigneeId)
    await this.createAuditLog(id, userId, 'ASSIGN', oldAssignee, assigneeId, remark || '分派任务')

    return updated
  }

  async reassign(id: string, assigneeId: string, userId: string, reason?: string) {
    const task = await this.prisma.task.findUnique({ where: { id } })
    if (!task) {
      throw new NotFoundException('任务不存在')
    }

    const oldAssignee = task.assigneeId

    if (oldAssignee) {
      await this.decrementUserTaskCount(oldAssignee)
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        assigneeId,
        status: TaskStatus.REASSIGNED,
      },
    })

    await this.incrementUserTaskCount(assigneeId)
    await this.createAuditLog(
      id,
      userId,
      'REASSIGN',
      oldAssignee,
      assigneeId,
      reason || '重新分派',
    )

    return updated
  }

  async reject(id: string, rejectReason: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id } })
    if (!task) {
      throw new NotFoundException('任务不存在')
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.REJECTED,
        rejectReason,
      },
    })

    if (task.assigneeId) {
      await this.decrementUserTaskCount(task.assigneeId)
    }

    await this.createAuditLog(id, userId, 'REJECT', task.status, TaskStatus.REJECTED, rejectReason)

    return updated
  }

  async resubmit(id: string, userId: string, data?: any) {
    const task = await this.prisma.task.findUnique({ where: { id } })
    if (!task) {
      throw new NotFoundException('任务不存在')
    }

    if (task.status !== TaskStatus.REJECTED) {
      throw new BadRequestException('只有被驳回的任务才能重新提交')
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.PENDING,
        ...data,
      },
    })

    if (task.assigneeId) {
      await this.incrementUserTaskCount(task.assigneeId)
    }

    await this.createAuditLog(
      id,
      userId,
      'RESUBMIT',
      TaskStatus.REJECTED,
      TaskStatus.PENDING,
      '重新提交',
    )

    return updated
  }

  async addMaterials(id: string, materials: any[], userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id } })
    if (!task) {
      throw new NotFoundException('任务不存在')
    }

    const existingMaterials = (task.materials as any[]) || []
    const updatedMaterials = [...existingMaterials, ...materials]

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        materials: updatedMaterials as any,
      },
    })

    await this.createAuditLog(id, userId, 'ADD_MATERIALS', null, null, '补充材料')

    return updated
  }

  async addComment(id: string, content: string, userId: string, attachments?: any[]) {
    const comment = await this.prisma.taskComment.create({
      data: {
        taskId: id,
        userId,
        content,
        attachments: attachments as any,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    })

    return comment
  }

  async delete(id: string) {
    return this.prisma.task.delete({ where: { id } })
  }

  async createAuditLog(
    taskId: string,
    userId: string,
    action: string,
    fromStatus: string | null,
    toStatus: string | null,
    remark?: string,
  ) {
    return this.prisma.taskAuditLog.create({
      data: {
        taskId,
        userId,
        action,
        fromStatus,
        toStatus,
        remark,
      },
    })
  }

  async incrementUserTaskCount(userId: string) {
    const key = `user:${userId}:task_count`
    await this.redisService.incr(key)
    await this.redisService.expire(key, 86400)
  }

  async decrementUserTaskCount(userId: string) {
    const key = `user:${userId}:task_count`
    const count = await this.redisService.get(key)
    if (count && parseInt(count) > 0) {
      await this.redisService.getClient().decr(key)
    }
  }

  async getUserTaskCount(userId: string) {
    const key = `user:${userId}:task_count`
    const count = await this.redisService.get(key)
    if (count !== null) {
      return parseInt(count)
    }

    const dbCount = await this.prisma.task.count({
      where: {
        assigneeId: userId,
        status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.REASSIGNED] },
      },
    })

    await this.redisService.set(key, String(dbCount), 86400)
    return dbCount
  }

  async getStats() {
    const byStatus = await this.prisma.task.groupBy({
      by: ['status'],
      _count: true,
    })

    const byType = await this.prisma.task.groupBy({
      by: ['type'],
      _count: true,
    })

    const overdueCount = await this.prisma.task.count({
      where: {
        OR: [
          { status: TaskStatus.OVERDUE },
          {
            status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
            dueDate: { lt: new Date() },
          },
        ],
      },
    })

    const total = await this.prisma.task.count()

    return {
      total,
      overdue: overdueCount,
      byStatus,
      byType,
    }
  }

  async getMyTasks(userId: string, status?: TaskStatus) {
    const where: any = { assigneeId: userId }
    if (status) where.status = status

    return this.prisma.task.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 20,
      include: {
        property: { select: { id: true, title: true, propertyNo: true } },
      },
    })
  }

  async getOverdueTasks() {
    const tasks = await this.prisma.task.findMany({
      where: {
        OR: [
          { status: TaskStatus.OVERDUE },
          {
            status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
            dueDate: { lt: new Date() },
            dueDate: { not: null },
          },
        ],
      },
      orderBy: { dueDate: 'asc' },
      include: {
        assignee: { select: { id: true, name: true } },
        property: { select: { id: true, title: true } },
        tenant: { select: { id: true, name: true } },
      },
    })

    return tasks
  }

  async getTaskTypes() {
    return Object.values(TaskType)
  }

  async getTaskStatuses() {
    return Object.values(TaskStatus)
  }

  async getPriorities() {
    return Object.values(Priority)
  }
}
