import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getMockOrders, getMockOrderDetail } from '@/lib/mockData'
import type { Order, OrderDetail } from '@/types'

const querySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  status: z.string().optional(),
  routeId: z.string().optional(),
  hasItemDamage: z.string().optional(),
  hasDispatchTimeout: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const status = searchParams.get('status') || undefined
    const routeId = searchParams.get('routeId') || undefined
    const hasItemDamage = searchParams.get('hasItemDamage') === 'true' ? true : 
                         searchParams.get('hasItemDamage') === 'false' ? false : undefined
    const hasDispatchTimeout = searchParams.get('hasDispatchTimeout') === 'true'
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    const validated = querySchema.safeParse({
      page: page.toString(),
      pageSize: pageSize.toString(),
      status,
      routeId,
      hasItemDamage: hasItemDamage?.toString(),
      startDate,
      endDate,
    })

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validated.error },
        { status: 400 }
      )
    }

    let orders: Order[]
    let total: number

    try {
      const where: any = {}
      if (status) where.status = status
      if (routeId) where.routeId = routeId
      if (hasItemDamage !== undefined) where.hasItemDamage = hasItemDamage
      if (hasDispatchTimeout) {
        where.dispatchDuration = { gt: 1800 }
      }
      if (startDate) {
        where.createdAt = { ...where.createdAt, gte: new Date(startDate) }
      }
      if (endDate) {
        where.createdAt = { ...where.createdAt, lte: new Date(endDate + 'T23:59:59') }
      }

      const [result, count] = await Promise.all([
        prisma.order.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            payment: true,
            appeal: true,
            tasks: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.order.count({ where }),
      ])

      orders = result as unknown as Order[]
      total = count
    } catch (dbError) {
      console.warn('Database connection failed, using mock data:', dbError)
      const mockResult = getMockOrders({ page, pageSize, status, routeId, hasItemDamage, hasDispatchTimeout })
      orders = mockResult.orders
      total = mockResult.total
    }

    return NextResponse.json({
      data: orders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Error in GET /api/orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
