import { NextResponse } from 'next/server'
import { z } from 'zod'
import { TaskService } from '@/services/TaskService'
import { getMockTaskDetail, updateMockTask } from '@/lib/mockData'
import type { Task, TaskStatus } from '@/types'

const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'processing', 'resolved', 'closed']),
  assigneeId: z.string().optional(),
  assigneeName: z.string().optional(),
})

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params

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
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
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
