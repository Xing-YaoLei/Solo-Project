import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ShareAccessResponse, UserRole, FunnelData, BoardData, TicketDetailResponse } from '@/lib/types'
import {
  REVIEW_OPINION_LABELS,
  CLOSURE_REASON_LABELS,
  TICKET_STATUS_LABELS,
  FUNNEL_STAGES,
} from '@/lib/constants'

function maskSensitiveData(data: any, role: UserRole): any {
  if (role === 'management' || role === 'compliance_officer') {
    return data
  }

  const masked = JSON.parse(JSON.stringify(data))

  if (masked.ticket) {
    if (role === 'auditor') {
      masked.ticket.description = masked.ticket.description
        ? masked.ticket.description.replace(/[\u4e00-\u9fa5a-zA-Z0-9]/g, '*')
        : masked.ticket.description
    }
    if (masked.emailMaterials) {
      masked.emailMaterials = masked.emailMaterials.map((m: any) => ({
        ...m,
        bodyPreview: m.bodyPreview ? m.bodyPreview.replace(/[\u4e00-\u9fa5a-zA-Z0-9]/g, '*') : m.bodyPreview,
        sender: '***@***.com',
        recipients: '***@***.com',
      }))
    }
  }

  return masked
}

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const roleParam = searchParams.get('role') as UserRole

    if (!roleParam) {
      return NextResponse.json(
        { error: '请提供访问角色' },
        { status: 400 }
      )
    }

    const validRoles: UserRole[] = ['auditor', 'business_owner', 'compliance_officer', 'management']
    if (!validRoles.includes(roleParam)) {
      return NextResponse.json(
        { allowed: false, error: '无效的角色' },
        { status: 403 }
      )
    }

    const shareLink = await prisma.shareLink.findUnique({
      where: { token: params.token },
    })

    if (!shareLink) {
      return NextResponse.json(
        { allowed: false, error: '分享链接不存在' },
        { status: 404 }
      )
    }

    if (new Date() > shareLink.expiresAt) {
      return NextResponse.json(
        { allowed: false, error: '分享链接已过期' },
        { status: 403 }
      )
    }

    const allowedRoles: UserRole[] = JSON.parse(shareLink.allowedRoles)
    if (!allowedRoles.includes(roleParam)) {
      return NextResponse.json(
        { allowed: false, error: '您的角色无权访问此内容' },
        { status: 403 }
      )
    }

    let data: FunnelData | BoardData | TicketDetailResponse | null = null
    let masked = false

    switch (shareLink.page) {
      case 'funnel':
        data = await getFunnelData()
        break
      case 'board':
        data = await getBoardData()
        break
      case 'ticket':
        if (shareLink.ticketId) {
          data = await getTicketDetail(shareLink.ticketId)
          if (roleParam !== 'compliance_officer' && roleParam !== 'management') {
            data = maskSensitiveData(data, roleParam)
            masked = true
          }
        }
        break
    }

    const response: ShareAccessResponse = {
      allowed: true,
      role: roleParam,
      data: data as any,
      masked,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error accessing share link:', error)
    return NextResponse.json({ error: '访问分享链接失败' }, { status: 500 })
  }
}

async function getFunnelData(): Promise<FunnelData> {
  const tickets = await prisma.ticket.findMany({
    include: {
      reviewRecords: { select: { id: true } },
      _count: { select: { reviewRecords: true } },
    },
  })

  const stageCounts: Record<string, number> = {
    discovered: 0,
    assigned: 0,
    remediating: 0,
    reviewing: 0,
    closed: 0,
  }

  tickets.forEach((ticket) => {
    let stage = 'discovered'
    if (ticket.status === 'closed') stage = 'closed'
    else if (ticket.status === 'pending_review') stage = 'reviewing'
    else if (ticket.status === 'in_remediation' || ticket._count.reviewRecords > 0) stage = 'remediating'
    else if (ticket.assigneeId) stage = 'assigned'
    stageCounts[stage]++
  })

  const closedTickets = tickets.filter((t) => t.status === 'closed')
  const totalClosed = closedTickets.length
  const firstResolutionCount = closedTickets.filter((t) => t.firstResolution).length
  const firstResolutionRate = totalClosed > 0 ? Math.round((firstResolutionCount / totalClosed) * 1000) / 10 : 0

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const now = new Date()
  const monthlyTrend: Array<{ month: string; rate: number }> = []

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)
    const monthTickets = tickets.filter((t) =>
      t.status === 'closed' &&
      new Date(t.createdAt) >= date &&
      new Date(t.createdAt) < nextMonth
    )
    const monthTotal = monthTickets.length
    const monthFirst = monthTickets.filter((t) => t.firstResolution).length
    monthlyTrend.push({
      month: monthNames[date.getMonth()],
      rate: monthTotal > 0 ? Math.round((monthFirst / monthTotal) * 1000) / 10 : 0,
    })
  }

  return {
    stages: FUNNEL_STAGES.map((stage) => ({
      stage: stage.key,
      count: stageCounts[stage.key] || 0,
      conversionRate: 0,
      conclusions: [],
    })),
    firstResolutionRate,
    firstResolutionTrend: monthlyTrend,
  }
}

async function getBoardData(): Promise<BoardData> {
  const tickets = await prisma.ticket.findMany({
    include: {
      reviewRecords: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  const approvedTickets = tickets.filter((t) => t.reviewRecords[0]?.opinion === 'approved')
  const rejectedTickets = tickets.filter((t) => t.reviewRecords[0]?.opinion === 'rejected')
  const returnedTickets = tickets.filter((t) => t.reviewRecords[0]?.opinion === 'returned_for_modification')
  const unreviewedTickets = tickets.filter((t) => !t.reviewRecords.length)

  return {
    groupBy: 'review_opinion',
    groups: [
      {
        key: 'approved',
        label: REVIEW_OPINION_LABELS.approved,
        count: approvedTickets.length,
      },
      {
        key: 'rejected',
        label: REVIEW_OPINION_LABELS.rejected,
        count: rejectedTickets.length,
      },
      {
        key: 'returned_for_modification',
        label: REVIEW_OPINION_LABELS.returned_for_modification,
        count: returnedTickets.length,
      },
      {
        key: 'unreviewed',
        label: '未复核',
        count: unreviewedTickets.length,
      },
    ],
  }
}

async function getTicketDetail(ticketId: string): Promise<TicketDetailResponse> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      remediationLogs: { orderBy: { createdAt: 'desc' } },
      reviewRecords: { orderBy: { createdAt: 'desc' } },
      emailMaterials: { orderBy: { sentAt: 'desc' } },
      remarkTasks: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!ticket) {
    throw new Error('Ticket not found')
  }

  return {
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
      createdAt: task.createdAt.toISOString(),
    })),
  }
}
