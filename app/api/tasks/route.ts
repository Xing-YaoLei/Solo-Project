import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { TaskService } from '@/services/TaskService'
import { getMockTasks } from '@/lib/mockData'
import type { Task, TaskStatus, TaskType, TaskPriority } from '@/types'

const querySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  status: z.enum(['pending', 'processing', 'resolved', 'closed']).optional(),
  type: z.enum(['item_damage', 'dispatch_timeout']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assigneeId: z.string().optional(),
  orderId: z.string().optional(),
})

const createSchema = z.object({
  orderId: z.string(),
  type: z.enum(['item_damage', 'dispatch_timeout']),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  title: z.string(),
  description: z.string().optional(),
  dispatchDuration: z.number().optional(),
  damageLevel: z.enum(['minor', 'moderate', 'severe']).optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const status = searchParams.get('status') as TaskStatus | undefined
    const type = searchParams.get('type') as TaskType | undefined
    const priority = searchParams.get('priority') as TaskPriority | undefined
    const assigneeId = searchParams.get('assigneeId') || undefined
    const orderId = searchParams.get('orderId') || undefined

    const validated = querySchema.safeParse({
      page: page.toString(),
      pageSize: pageSize.toString(),
      status,
      type,
      priority,
      assigneeId,
      orderId,
    })

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validated.error },
        { status: 400 }
      )
    }

    let tasks: Task[]
    let total: number

    try {
      const result = await TaskService.getTasks({
        status,
        type,
        priority,
        assigneeId,
        orderId,
        skip: (page - 1) * pageSize,
        take: pageSize,
      })
      tasks = result.tasks
      total = result.total
    } catch (dbError) {
      console.warn('Database connection failed, using mock data:', dbError)
      const mockResult = getMockTasks({ page, pageSize, status, type, priority })
      tasks = mockResult.tasks
      total = mockResult.total
    }

    const pendingCount = tasks.filter(t => t.status === 'pending').length
    const highPriorityCount = tasks.filter(t => t.priority === 'high' && (t.status === 'pending' || t.status === 'processing')).length

    return NextResponse.json({
      data: tasks,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      summary: {
        pendingCount,
        highPriorityCount,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = createSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validated.error },
        { status: 400 }
      )
    }

    let task: Task

    try {
      task = await TaskService.createTask(validated.data)
    } catch (dbError) {
      console.warn('Database connection failed, using mock data:', dbError)
      task = {
        id: Math.random().toString(36).substring(2, 15),
        ...validated.data,
        status: 'pending' as TaskStatus,
        createdAt: new Date(),
      } as Task
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
