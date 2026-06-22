import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { TicketListResponse } from '@/lib/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const status = searchParams.get('status')
  const department = searchParams.get('department')
  const assigneeId = searchParams.get('assigneeId')
  const auditorId = searchParams.get('auditorId')

  try {
    const where: any = {}
    if (status) where.status = status
    if (department && department !== '全部部门') where.department = department
    if (assigneeId) where.assigneeId = assigneeId
    if (auditorId) where.auditorId = auditorId

    const skip = (page - 1) * pageSize

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ticket.count({ where }),
    ])

    const response: TicketListResponse = {
      tickets: tickets.map((t) => ({
        ...t,
        dueDate: t.dueDate?.toISOString() || '',
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        description: t.description || '',
        department: t.department || '',
        assigneeId: t.assigneeId || '',
        auditorId: t.auditorId || '',
        closureReason: t.closureReason || undefined,
      })),
      total,
      page,
      pageSize,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }
}
