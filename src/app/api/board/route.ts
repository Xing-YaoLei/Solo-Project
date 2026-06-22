import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { BoardData, BoardGroupBy, BoardGroup, TicketStatus } from '@/lib/types'
import {
  REVIEW_OPINION_LABELS,
  CLOSURE_REASON_LABELS,
  TICKET_STATUS_LABELS,
} from '@/lib/constants'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const groupBy = searchParams.get('groupBy') as BoardGroupBy || 'review_opinion'
  const statusFilter = searchParams.get('status')
  const department = searchParams.get('department')

  try {
    const where: any = {}
    if (statusFilter) where.status = statusFilter
    if (department && department !== '全部部门') where.department = department

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        reviewRecords: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    let groups: BoardGroup[] = []

    switch (groupBy) {
      case 'review_opinion':
        groups = await buildReviewOpinionGroups(tickets)
        break
      case 'closure_reason':
        groups = await buildClosureReasonGroups(tickets)
        break
      case 'status':
        groups = await buildStatusGroups(tickets)
        break
    }

    const response: BoardData = {
      groupBy,
      groups,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching board data:', error)
    return NextResponse.json({ error: 'Failed to fetch board data' }, { status: 500 })
  }
}

async function buildReviewOpinionGroups(tickets: any[]): Promise<BoardGroup[]> {
  const approvedTickets: any[] = []
  const rejectedTickets: any[] = []
  const returnedTickets: any[] = []
  const unreviewedTickets: any[] = []

  tickets.forEach((ticket) => {
    const latestReview = ticket.reviewRecords[0]
    if (!latestReview) {
      unreviewedTickets.push(ticket)
      return
    }
    switch (latestReview.opinion) {
      case 'approved':
        approvedTickets.push(ticket)
        break
      case 'rejected':
        rejectedTickets.push(ticket)
        break
      case 'returned_for_modification':
        returnedTickets.push(ticket)
        break
    }
  })

  const groupByClosure = (items: any[]) => {
    const remediated = items.filter((t) => t.closureReason === 'remediated')
    const riskAccepted = items.filter((t) => t.closureReason === 'risk_accepted')
    const other = items.filter((t) => !t.closureReason || t.closureReason === 'no_longer_applicable')
    return [
      {
        key: 'remediated',
        label: '整改完成',
        count: remediated.length,
        tickets: remediated.slice(0, 5).map((t) => ({
          id: t.id,
          ticketNo: t.ticketNo,
          title: t.title,
          status: t.status as TicketStatus,
        })),
      },
      {
        key: 'risk_accepted',
        label: '风险接受',
        count: riskAccepted.length,
        tickets: riskAccepted.slice(0, 5).map((t) => ({
          id: t.id,
          ticketNo: t.ticketNo,
          title: t.title,
          status: t.status as TicketStatus,
        })),
      },
      {
        key: 'other',
        label: '其他',
        count: other.length,
        tickets: other.slice(0, 5).map((t) => ({
          id: t.id,
          ticketNo: t.ticketNo,
          title: t.title,
          status: t.status as TicketStatus,
        })),
      },
    ]
  }

  const groupByAction = (items: any[]) => {
    const inRemediation = items.filter((t) => t.status === 'in_remediation')
    const pendingReview = items.filter((t) => t.status === 'pending_review')
    const pending = items.filter((t) => t.status === 'pending_remediation')
    return [
      {
        key: 'in_remediation',
        label: '整改中',
        count: inRemediation.length,
        tickets: inRemediation.slice(0, 5).map((t) => ({
          id: t.id,
          ticketNo: t.ticketNo,
          title: t.title,
          status: t.status as TicketStatus,
        })),
      },
      {
        key: 'pending_review',
        label: '待复核',
        count: pendingReview.length,
        tickets: pendingReview.slice(0, 5).map((t) => ({
          id: t.id,
          ticketNo: t.ticketNo,
          title: t.title,
          status: t.status as TicketStatus,
        })),
      },
      {
        key: 'pending',
        label: '待整改',
        count: pending.length,
        tickets: pending.slice(0, 5).map((t) => ({
          id: t.id,
          ticketNo: t.ticketNo,
          title: t.title,
          status: t.status as TicketStatus,
        })),
      },
    ]
  }

  return [
    {
      key: 'approved',
      label: REVIEW_OPINION_LABELS.approved,
      count: approvedTickets.length,
      children: groupByClosure(approvedTickets),
    },
    {
      key: 'rejected',
      label: REVIEW_OPINION_LABELS.rejected,
      count: rejectedTickets.length,
      children: groupByAction(rejectedTickets),
    },
    {
      key: 'returned_for_modification',
      label: REVIEW_OPINION_LABELS.returned_for_modification,
      count: returnedTickets.length,
      children: groupByAction(returnedTickets),
    },
    {
      key: 'unreviewed',
      label: '未复核',
      count: unreviewedTickets.length,
      children: groupByAction(unreviewedTickets),
    },
  ]
}

async function buildClosureReasonGroups(tickets: any[]): Promise<BoardGroup[]> {
  const closedTickets = tickets.filter((t) => t.status === 'closed')

  const remediated = closedTickets.filter((t) => t.closureReason === 'remediated')
  const riskAccepted = closedTickets.filter((t) => t.closureReason === 'risk_accepted')
  const noLongerApplicable = closedTickets.filter((t) => t.closureReason === 'no_longer_applicable')

  const groupByReview = (items: any[]) => {
    const firstTime = items.filter((t) => t.firstResolution)
    const multiple = items.filter((t) => !t.firstResolution)
    return [
      {
        key: 'first_time',
        label: '首次解决',
        count: firstTime.length,
        tickets: firstTime.slice(0, 5).map((t) => ({
          id: t.id,
          ticketNo: t.ticketNo,
          title: t.title,
          status: t.status as TicketStatus,
        })),
      },
      {
        key: 'multiple',
        label: '多次整改',
        count: multiple.length,
        tickets: multiple.slice(0, 5).map((t) => ({
          id: t.id,
          ticketNo: t.ticketNo,
          title: t.title,
          status: t.status as TicketStatus,
        })),
      },
    ]
  }

  return [
    {
      key: 'remediated',
      label: CLOSURE_REASON_LABELS.remediated,
      count: remediated.length,
      children: groupByReview(remediated),
    },
    {
      key: 'risk_accepted',
      label: CLOSURE_REASON_LABELS.risk_accepted,
      count: riskAccepted.length,
      children: groupByReview(riskAccepted),
    },
    {
      key: 'no_longer_applicable',
      label: CLOSURE_REASON_LABELS.no_longer_applicable,
      count: noLongerApplicable.length,
      children: groupByReview(noLongerApplicable),
    },
  ]
}

async function buildStatusGroups(tickets: any[]): Promise<BoardGroup[]> {
  const pending = tickets.filter((t) => t.status === 'pending_remediation')
  const inRemediation = tickets.filter((t) => t.status === 'in_remediation')
  const pendingReview = tickets.filter((t) => t.status === 'pending_review')
  const closed = tickets.filter((t) => t.status === 'closed')

  const now = new Date()

  const groupByAssignee = (items: any[]) => {
    const assigned = items.filter((t) => t.assigneeId)
    const unassigned = items.filter((t) => !t.assigneeId)
    return [
      {
        key: 'assigned',
        label: '已分配',
        count: assigned.length,
        tickets: assigned.slice(0, 5).map((t) => ({
          id: t.id,
          ticketNo: t.ticketNo,
          title: t.title,
          status: t.status as TicketStatus,
        })),
      },
      {
        key: 'unassigned',
        label: '未分配',
        count: unassigned.length,
        tickets: unassigned.slice(0, 5).map((t) => ({
          id: t.id,
          ticketNo: t.ticketNo,
          title: t.title,
          status: t.status as TicketStatus,
        })),
      },
    ]
  }

  const groupByDueDate = (items: any[]) => {
    const overdue = items.filter((t) => t.dueDate && new Date(t.dueDate) < now)
    const onTrack = items.filter((t) => !t.dueDate || new Date(t.dueDate) >= now)
    return [
      {
        key: 'on_track',
        label: '按期进行',
        count: onTrack.length,
        tickets: onTrack.slice(0, 5).map((t) => ({
          id: t.id,
          ticketNo: t.ticketNo,
          title: t.title,
          status: t.status as TicketStatus,
        })),
      },
      {
        key: 'overdue',
        label: '已逾期',
        count: overdue.length,
        tickets: overdue.slice(0, 5).map((t) => ({
          id: t.id,
          ticketNo: t.ticketNo,
          title: t.title,
          status: t.status as TicketStatus,
        })),
      },
    ]
  }

  const groupByReviewCount = (items: any[]) => {
    const firstReview = items.filter((t) => !t.reviewRecords || t.reviewRecords.length === 0)
    const secondReview = items.filter((t) => t.reviewRecords && t.reviewRecords.length >= 1)
    return [
      {
        key: 'first',
        label: '首次复核',
        count: firstReview.length,
        tickets: firstReview.slice(0, 5).map((t) => ({
          id: t.id,
          ticketNo: t.ticketNo,
          title: t.title,
          status: t.status as TicketStatus,
        })),
      },
      {
        key: 'second',
        label: '二次复核',
        count: secondReview.length,
        tickets: secondReview.slice(0, 5).map((t) => ({
          id: t.id,
          ticketNo: t.ticketNo,
          title: t.title,
          status: t.status as TicketStatus,
        })),
      },
    ]
  }

  const groupByClosure = (items: any[]) => {
    const remediated = items.filter((t) => t.closureReason === 'remediated')
    const other = items.filter((t) => t.closureReason !== 'remediated')
    return [
      {
        key: 'normal',
        label: '正常关闭',
        count: remediated.length,
        tickets: remediated.slice(0, 5).map((t) => ({
          id: t.id,
          ticketNo: t.ticketNo,
          title: t.title,
          status: t.status as TicketStatus,
        })),
      },
      {
        key: 'exception',
        label: '异常关闭',
        count: other.length,
        tickets: other.slice(0, 5).map((t) => ({
          id: t.id,
          ticketNo: t.ticketNo,
          title: t.title,
          status: t.status as TicketStatus,
        })),
      },
    ]
  }

  return [
    {
      key: 'pending_remediation',
      label: TICKET_STATUS_LABELS.pending_remediation,
      count: pending.length,
      children: groupByAssignee(pending),
    },
    {
      key: 'in_remediation',
      label: TICKET_STATUS_LABELS.in_remediation,
      count: inRemediation.length,
      children: groupByDueDate(inRemediation),
    },
    {
      key: 'pending_review',
      label: TICKET_STATUS_LABELS.pending_review,
      count: pendingReview.length,
      children: groupByReviewCount(pendingReview),
    },
    {
      key: 'closed',
      label: TICKET_STATUS_LABELS.closed,
      count: closed.length,
      children: groupByClosure(closed),
    },
  ]
}
