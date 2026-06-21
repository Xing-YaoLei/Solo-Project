import { NextResponse } from 'next/server'
import { z } from 'zod'
import { TaskService } from '@/services/TaskService'
import { ConclusionService } from '@/services/ConclusionService'
import { resolveMockTask, createMockConclusion } from '@/lib/mockData'
import type { Task } from '@/types'

const resolveSchema = z.object({
  resolution: z.string(),
  conclusion: z.string(),
  attachments: z.array(z.string()).optional(),
  authorId: z.string().optional(),
  authorName: z.string().optional(),
  chartPointId: z.string().optional(),
  chartType: z.enum(['funnel', 'dispatch_trend', 'payment_trend']).optional(),
})

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
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
      if (task) {
        conclusion = await ConclusionService.createConclusion({
          orderId: task.orderId,
          taskId: id,
          chartPointId: validated.data.chartPointId || `task-${id}`,
          chartType: validated.data.chartType || 'funnel',
          content: validated.data.conclusion,
          authorId: validated.data.authorId || 'system',
          authorName: validated.data.authorName || '系统自动',
          attachments: validated.data.attachments || [],
        })
      }
    } catch (dbError) {
      console.warn('Database connection failed, using mock data:', dbError)
      task = resolveMockTask(id, validated.data.resolution)
      conclusion = createMockConclusion({
        orderId: task?.orderId || '',
        taskId: id,
        chartPointId: validated.data.chartPointId || `task-${id}`,
        chartType: validated.data.chartType || 'funnel',
        content: validated.data.conclusion,
        authorId: validated.data.authorId || 'system',
        authorName: validated.data.authorName || '系统自动',
        attachments: validated.data.attachments || [],
      })
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
