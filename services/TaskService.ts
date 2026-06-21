import prisma from '@/lib/prisma'
import type { Task, TaskType, TaskPriority, TaskStatus, DamageLevel } from '@/types'

export class TaskService {
  static async createTask(data: {
    orderId: string
    type: TaskType
    priority?: TaskPriority
    title: string
    description?: string
    dispatchDuration?: number
    damageLevel?: DamageLevel
  }): Promise<Task> {
    const task = await prisma.task.create({
      data: {
        orderId: data.orderId,
        type: data.type,
        priority: data.priority || 'medium',
        title: data.title,
        description: data.description,
        dispatchDuration: data.dispatchDuration,
        damageLevel: data.damageLevel,
        status: 'pending',
      },
    })
    return task as unknown as Task
  }

  static async getTasks(params: {
    status?: TaskStatus
    type?: TaskType
    priority?: TaskPriority
    assigneeId?: string
    orderId?: string
    skip?: number
    take?: number
  }): Promise<{ tasks: Task[]; total: number }> {
    const where: any = {}
    if (params.status) where.status = params.status
    if (params.type) where.type = params.type
    if (params.priority) where.priority = params.priority
    if (params.assigneeId) where.assigneeId = params.assigneeId
    if (params.orderId) where.orderId = params.orderId

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip: params.skip || 0,
        take: params.take || 50,
        include: { order: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.count({ where }),
    ])

    return { tasks: tasks as unknown as Task[], total }
  }

  static async getTaskById(id: string): Promise<Task | null> {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            payment: true,
            appeal: true,
            customerServiceRecs: true,
            conclusions: true,
          },
        },
        conclusion: true,
      },
    })
    return task as unknown as Task | null
  }

  static async updateTaskStatus(id: string, status: TaskStatus, assigneeId?: string, assigneeName?: string): Promise<Task | null> {
    const data: any = { status }
    if (assigneeId) {
      data.assigneeId = assigneeId
      data.assigneeName = assigneeName
    }
    if (status === 'processing' && !data.assigneeId) {
      throw new Error('Assignee is required when setting status to processing')
    }
    const task = await prisma.task.update({ where: { id }, data })
    return task as unknown as Task
  }

  static async resolveTask(id: string, resolution: string): Promise<Task | null> {
    const task = await prisma.task.update({
      where: { id },
      data: {
        status: 'resolved',
        resolution,
        resolvedAt: new Date(),
      },
    })
    return task as unknown as Task
  }

  static async autoCreateDispatchTimeoutTask(
    orderId: string,
    dispatchDuration: number,
    threshold: number
  ): Promise<Task | null> {
    const config = await prisma.systemConfig.findFirst()
    if (!config?.autoCreateTaskOnTimeout) return null
    if (dispatchDuration <= threshold) return null

    const existingTask = await prisma.task.findFirst({
      where: {
        orderId,
        type: 'dispatch_timeout',
        status: { in: ['pending', 'processing'] },
      },
    })
    if (existingTask) return existingTask as unknown as Task

    const overTime = dispatchDuration - threshold
    const priority: TaskPriority = overTime > 3600 ? 'high' : overTime > 1800 ? 'medium' : 'low'
    
    return this.createTask({
      orderId,
      type: 'dispatch_timeout',
      priority,
      title: `派单超时 - 超出阈值${Math.floor(overTime / 60)}分钟`,
      description: `派单时长为${Math.floor(dispatchDuration / 60)}分钟，超出阈值${Math.floor(threshold / 60)}分钟`,
      dispatchDuration,
    })
  }

  static async autoCreateItemDamageTask(
    orderId: string,
    damageLevel: DamageLevel
  ): Promise<Task | null> {
    const config = await prisma.systemConfig.findFirst()
    if (!config?.autoCreateTaskOnDamage) return null

    const existingTask = await prisma.task.findFirst({
      where: {
        orderId,
        type: 'item_damage',
        status: { in: ['pending', 'processing'] },
      },
    })
    if (existingTask) return existingTask as unknown as Task

    const priority: TaskPriority = damageLevel === 'severe' ? 'high' : damageLevel === 'moderate' ? 'medium' : 'low'
    
    return this.createTask({
      orderId,
      type: 'item_damage',
      priority,
      title: `物品损坏 - ${damageLevel === 'severe' ? '严重' : damageLevel === 'moderate' ? '中度' : '轻微'}`,
      description: `订单报告物品损坏，损坏程度：${damageLevel === 'severe' ? '严重' : damageLevel === 'moderate' ? '中度' : '轻微'}`,
      damageLevel,
    })
  }

  static async getPendingTasksCount(): Promise<number> {
    return prisma.task.count({
      where: { status: { in: ['pending', 'processing'] } },
    })
  }

  static async getHighPriorityTasksCount(): Promise<number> {
    return prisma.task.count({
      where: { priority: 'high', status: { in: ['pending', 'processing'] } },
    })
  }
}
