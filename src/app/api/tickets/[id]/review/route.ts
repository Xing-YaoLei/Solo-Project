import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { ReviewRequest, ReviewResponse, ReviewOpinion } from '@/lib/types'
import { getCurrentUserId } from '@/lib/auth'

const reviewSchema = z.object({
  opinion: z.enum(['approved', 'rejected', 'returned_for_modification']),
  comment: z.string().min(1, '复核意见不能为空'),
})

function generateRemarkTasks(
  opinion: ReviewOpinion,
  comment: string
): Array<{ description: string; priority: 'high' | 'medium' | 'low' }> {
  const tasks: Array<{ description: string; priority: 'high' | 'medium' | 'low' }> = []

  if (opinion === 'rejected') {
    tasks.push({
      description: `复核不通过：${comment.substring(0, 100)}${comment.length > 100 ? '...' : ''}`,
      priority: 'high',
    })
    tasks.push({
      description: '重新制定整改方案并提交审核',
      priority: 'high',
    })
    tasks.push({
      description: '组织整改团队复盘，分析失败原因',
      priority: 'medium',
    })
  } else if (opinion === 'returned_for_modification') {
    tasks.push({
      description: `需补充修改：${comment.substring(0, 100)}${comment.length > 100 ? '...' : ''}`,
      priority: 'medium',
    })
    tasks.push({
      description: '按照复核意见补充整改材料',
      priority: 'medium',
    })
  }

  return tasks
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json()) as ReviewRequest
    const validation = reviewSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { opinion, comment } = validation.data
    const currentUserId = await getCurrentUserId(request)

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: { reviewRecords: { orderBy: { createdAt: 'desc' } } },
    })

    if (!ticket) {
      return NextResponse.json({ error: '工单不存在' }, { status: 404 })
    }

    const reviewCount = ticket.reviewRecords.length
    const isFirstResolution = opinion === 'approved' && reviewCount === 0

    const result = await prisma.$transaction(async (tx) => {
      const review = await tx.reviewRecord.create({
        data: {
          ticketId: params.id,
          opinion,
          comment,
          reviewerId: currentUserId,
        },
      })

      let newStatus = ticket.status
      let closureReason = ticket.closureReason

      if (opinion === 'approved') {
        newStatus = 'closed'
        closureReason = 'remediated'
      } else if (opinion === 'rejected' || opinion === 'returned_for_modification') {
        newStatus = 'in_remediation'
        closureReason = null
      }

      await tx.ticket.update({
        where: { id: params.id },
        data: {
          status: newStatus,
          closureReason,
          firstResolution: isFirstResolution ? true : ticket.firstResolution,
          updatedAt: new Date(),
        },
      })

      await tx.remediationLog.create({
        data: {
          ticketId: params.id,
          action: `复核${opinion === 'approved' ? '通过' : opinion === 'rejected' ? '不通过' : '退回修改'}`,
          description: comment,
          operatorId: currentUserId,
        },
      })

      let remarkTask = undefined
      if (opinion === 'rejected' || opinion === 'returned_for_modification') {
        const tasks = generateRemarkTasks(opinion, comment)
        const createdTasks = await Promise.all(
          tasks.map((task) =>
            tx.remarkTask.create({
              data: {
                ticketId: params.id,
                reviewId: review.id,
                description: task.description,
                priority: task.priority,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              },
            })
          )
        )
        remarkTask = createdTasks[0]
      }

      return { review, remarkTask }
    })

    const response: ReviewResponse = {
      review: {
        id: result.review.id,
        ticketId: result.review.ticketId,
        reviewerId: result.review.reviewerId,
        opinion: result.review.opinion,
        comment: result.review.comment || '',
        createdAt: result.review.createdAt.toISOString(),
      },
      remarkTask: result.remarkTask
        ? {
            id: result.remarkTask.id,
            ticketId: result.remarkTask.ticketId,
            reviewId: result.remarkTask.reviewId,
            description: result.remarkTask.description,
            priority: result.remarkTask.priority,
            dueDate: result.remarkTask.dueDate?.toISOString() || '',
            completed: result.remarkTask.completed,
            createdAt: result.remarkTask.createdAt.toISOString(),
          }
        : undefined,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error submitting review:', error)
    return NextResponse.json({ error: '提交复核失败' }, { status: 500 })
  }
}
