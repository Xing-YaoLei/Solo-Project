import { NextResponse } from 'next/server'
import { z } from 'zod'
import { TaskService } from '@/services/TaskService'
import { getMockTaskDetail, updateMockTask, resolveMockTask } from '@/lib/mockData'
import type { Task, TaskStatus } from '@/types'

const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'processing', 'resolved', 'closed']),
  assigneeId: z.string().optional(),
  assigneeName: z.string().optional(),
})

const resolveSchema = z.object({
  resolution: z.string(),
  conclusion: z.string(),
  attachments: z.array(z.string()).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    let task: Task | null

    try {
      task = await TaskService.getTaskById(id)
    } catch (dbError) {
      console.warn('Database connection failed, using mock data:', dbError)
      task = getMockTaskDetail(id)
    }

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error in GET /api/tasks/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const validated = statusUpdateSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validated.error },
        { status: 400 }
      )
    }

    let task: Task | null

    try {
      task = await TaskService.updateTaskStatus(
        id,
        validated.data.status,
        validated.data.assigneeId,
        validated.data.assigneeName
      )
    } catch (dbError) {
      console.warn('Database connection failed, using mock data:', dbError)
      task = updateMockTask(id, { status: validated.data.status })
    }

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error in PUT /api/tasks/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const url = new URL(request.url)
  if (url.pathname.endsWith('/resolve')) {
    return handleResolve(request, params)
  }

  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

async function handleResolve(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const validated = resolveSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validated.error },
        { status: 400 }
      )
    }

    let task: Task | null
    let conclusion

    try {
      task = await TaskService.resolveTask(id, validated.data.resolution)
    } catch (dbError) {
      console.warn('Database connection failed, using mock data:', dbError)
      task = resolveMockTask(id, validated.data.resolution)
      conclusion = {
        id: Math.random().toString(36).substring(2, 15),
        orderId: task?.orderId || '',
        taskId: id,
        chartPointId: '',
        chartType: 'funnel',
        content: validated.data.conclusion,
        authorId: 'mock-author-id',
        authorName: 'Mock User',
        createdAt: new Date(),
        attachments: validated.data.attachments || [],
      }
    }

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, task, conclusion })
  } catch (error) {
    console.error('Error in POST /api/tasks/[id]/resolve:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
