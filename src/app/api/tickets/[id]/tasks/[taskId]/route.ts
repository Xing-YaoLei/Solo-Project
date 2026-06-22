import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateTaskSchema = z.object({
  completed: z.boolean().optional(),
  description: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const body = await request.json()
    const validation = updateTaskSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const task = await prisma.remarkTask.findUnique({
      where: { id: params.taskId },
    })

    if (!task || task.ticketId !== params.id) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    const updateData: any = { ...validation.data }
    if (validation.data.completed !== undefined) {
      updateData.completedAt = validation.data.completed ? new Date() : null
      if (validation.data.completed) {
        updateData.completedById = '1'
      } else {
        updateData.completedById = null
      }
    }

    const updatedTask = await prisma.remarkTask.update({
      where: { id: params.taskId },
      data: updateData,
    })

    await prisma.remediationLog.create({
      data: {
        ticketId: params.id,
        action: validation.data.completed ? '完成备注任务' : '重新打开备注任务',
        description: updatedTask.description,
        operatorId: '1',
      },
    })

    return NextResponse.json({
      id: updatedTask.id,
      ticketId: updatedTask.ticketId,
      reviewId: updatedTask.reviewId,
      description: updatedTask.description,
      priority: updatedTask.priority,
      dueDate: updatedTask.dueDate?.toISOString() || '',
      completed: updatedTask.completed,
      completedAt: updatedTask.completedAt?.toISOString() || undefined,
      createdAt: updatedTask.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: '更新任务失败' }, { status: 500 })
  }
}
