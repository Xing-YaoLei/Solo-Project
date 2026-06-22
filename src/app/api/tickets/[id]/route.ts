import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { TicketDetailResponse } from '@/lib/types'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        assignee: { select: { id: true, name: true, email: true, role: true } },
        auditor: { select: { id: true, name: true, email: true, role: true } },
        remediationLogs: {
          include: { operator: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        reviewRecords: {
          include: { reviewer: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        emailMaterials: {
          orderBy: { sentAt: 'desc' },
        },
        remarkTasks: {
          include: { completedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const response: TicketDetailResponse = {
      ticket: {
        id: ticket.id,
        ticketNo: ticket.ticketNo,
        title: ticket.title,
        description: ticket.description || '',
        status: ticket.status,
        department: ticket.department || '',
        assigneeId: ticket.assigneeId || '',
        auditorId: ticket.auditorId || '',
        dueDate: ticket.dueDate?.toISOString() || '',
        closureReason: ticket.closureReason || undefined,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        firstResolution: ticket.firstResolution,
      },
      remediationLog: ticket.remediationLogs.map((log) => ({
        id: log.id,
        ticketId: log.ticketId,
        action: log.action,
        description: log.description || '',
        operatorId: log.operatorId || '',
        createdAt: log.createdAt.toISOString(),
      })),
      reviewRecords: ticket.reviewRecords.map((record) => ({
        id: record.id,
        ticketId: record.ticketId,
        reviewerId: record.reviewerId,
        opinion: record.opinion,
        comment: record.comment || '',
        createdAt: record.createdAt.toISOString(),
      })),
      emailMaterials: ticket.emailMaterials.map((material) => ({
        id: material.id,
        ticketId: material.ticketId,
        subject: material.subject,
        sender: material.sender,
        recipients: material.recipients,
        sentAt: material.sentAt.toISOString(),
        bodyPreview: material.bodyPreview || '',
        attachmentUrls: material.attachmentUrls || '',
        storagePath: material.storagePath || '',
        createdAt: material.createdAt.toISOString(),
      })),
      remarkTasks: ticket.remarkTasks.map((task) => ({
        id: task.id,
        ticketId: task.ticketId,
        reviewId: task.reviewId,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate?.toISOString() || '',
        completed: task.completed,
        completedBy: task.completedBy?.name || undefined,
        completedAt: task.completedAt?.toISOString() || undefined,
        createdAt: task.createdAt.toISOString(),
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching ticket detail:', error)
    return NextResponse.json({ error: 'Failed to fetch ticket detail' }, { status: 500 })
  }
}
