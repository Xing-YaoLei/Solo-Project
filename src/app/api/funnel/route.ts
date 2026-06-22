import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { FunnelData, FunnelStageKey } from '@/lib/types'

const STAGE_MAP: Record<string, FunnelStageKey> = {
  discovered: 'discovered',
  assigned: 'assigned',
  remediating: 'remediating',
  reviewing: 'reviewing',
  closed: 'closed',
}

function getStageFromStatus(status: string, hasAssignee: boolean, hasReviews: boolean): FunnelStageKey {
  if (status === 'closed') return 'closed'
  if (status === 'pending_review') return 'reviewing'
  if (status === 'in_remediation' || (hasReviews && status !== 'closed')) return 'remediating'
  if (hasAssignee) return 'assigned'
  return 'discovered'
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const department = searchParams.get('department')

  try {
    const where: any = {}
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) }
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) }
    if (department && department !== '全部部门') where.department = department

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        reviewRecords: { select: { id: true } },
        _count: { select: { reviewRecords: true } },
      },
    })

    const stageCounts: Record<FunnelStageKey, number> = {
      discovered: 0,
      assigned: 0,
      remediating: 0,
      reviewing: 0,
      closed: 0,
    }

    const stageConclusions: Record<FunnelStageKey, Array<{ summary: string; detail: string }>> = {
      discovered: [],
      assigned: [],
      remediating: [],
      reviewing: [],
      closed: [],
    }

    tickets.forEach((ticket) => {
      const stage = getStageFromStatus(
        ticket.status,
        !!ticket.assigneeId,
        ticket._count.reviewRecords > 0
      )
      stageCounts[stage]++
    })

    const closedTickets = tickets.filter((t) => t.status === 'closed')
    const totalClosed = closedTickets.length
    const firstResolutionCount = closedTickets.filter((t) => t.firstResolution).length
    const firstResolutionRate = totalClosed > 0 ? Math.round((firstResolutionCount / totalClosed) * 1000) / 10 : 0

    const discoveredCount = tickets.length
    stageConclusions.discovered = [{
      summary: `本期共发现 ${discoveredCount} 项审计问题`,
      detail: `涵盖权限异常、数据访问、流程违规等类别`,
    }]

    const assignedCount = stageCounts.assigned + stageCounts.remediating + stageCounts.reviewing + stageCounts.closed
    stageConclusions.assigned = [{
      summary: `已分配整改任务 ${assignedCount} 项`,
      detail: `${stageCounts.discovered} 项尚未分配责任人`,
    }]

    const remediatingTickets = tickets.filter((t) =>
      getStageFromStatus(t.status, !!t.assigneeId, t._count.reviewRecords > 0) === 'remediating'
    )
    stageConclusions.remediating = [{
      summary: `整改执行中 ${remediatingTickets.length} 项`,
      detail: remediatingTickets.length > 0 ? `涉及 ${new Set(remediatingTickets.map((t) => t.department).filter(Boolean)).size} 个部门` : '暂无整改中项目',
    }]

    const reviewingTickets = tickets.filter((t) => t.status === 'pending_review')
    const secondReview = reviewingTickets.filter((t) => t._count.reviewRecords > 1).length
    stageConclusions.reviewing = [{
      summary: `待复核 ${reviewingTickets.length} 项`,
      detail: `其中 ${secondReview} 项为二次复核`,
    }]

    const remediated = closedTickets.filter((t) => t.closureReason === 'remediated').length
    const riskAccepted = closedTickets.filter((t) => t.closureReason === 'risk_accepted').length
    const noLongerApplicable = closedTickets.filter((t) => t.closureReason === 'no_longer_applicable').length
    stageConclusions.closed = [{
      summary: `已关闭 ${totalClosed} 项`,
      detail: `整改完成 ${remediated} 项，风险接受 ${riskAccepted} 项，不再适用 ${noLongerApplicable} 项`,
    }]

    const stages = [
      { stage: 'discovered' as FunnelStageKey, count: discoveredCount, conversionRate: 100, conclusions: stageConclusions.discovered },
      { stage: 'assigned' as FunnelStageKey, count: assignedCount, conversionRate: discoveredCount > 0 ? Math.round((assignedCount / discoveredCount) * 1000) / 10 : 0, conclusions: stageConclusions.assigned },
      { stage: 'remediating' as FunnelStageKey, count: remediatingTickets.length, conversionRate: assignedCount > 0 ? Math.round((remediatingTickets.length / assignedCount) * 1000) / 10 : 0, conclusions: stageConclusions.remediating },
      { stage: 'reviewing' as FunnelStageKey, count: reviewingTickets.length, conversionRate: remediatingTickets.length > 0 ? Math.round((reviewingTickets.length / remediatingTickets.length) * 1000) / 10 : 0, conclusions: stageConclusions.reviewing },
      { stage: 'closed' as FunnelStageKey, count: totalClosed, conversionRate: reviewingTickets.length > 0 ? Math.round((totalClosed / reviewingTickets.length) * 1000) / 10 : 0, conclusions: stageConclusions.closed },
    ]

    const trendData = await prisma.ticket.groupBy({
      by: ['createdAt'],
      where: {
        status: 'closed',
        createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 5)) },
      },
      _count: { id: true, firstResolution: true },
      orderBy: { createdAt: 'asc' },
    })

    const monthlyTrend: Array<{ month: string; rate: number }> = []
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    const now = new Date()

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

    const response: FunnelData = {
      stages,
      firstResolutionRate,
      firstResolutionTrend: monthlyTrend,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching funnel data:', error)
    return NextResponse.json({ error: 'Failed to fetch funnel data' }, { status: 500 })
  }
}
