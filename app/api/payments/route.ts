import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getMockPayments } from '@/lib/mockData'
import type { Payment } from '@/types'

const querySchema = z.object({
  orderId: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const validated = querySchema.safeParse({ orderId, page: page.toString(), pageSize: pageSize.toString() })
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validated.error },
        { status: 400 }
      )
    }

    let payments: Payment[]
    let total: number

    try {
      const where: any = {}
      if (orderId) where.orderId = orderId

      const [result, count] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: { order: { select: { orderNo: true, routeName: true } } },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.payment.count({ where }),
      ])
      payments = result as unknown as Payment[]
      total = count
    } catch (dbError) {
      console.warn('Database connection failed, using mock data:', dbError)
      const mockResult = getMockPayments(orderId)
      payments = mockResult.data.slice((page - 1) * pageSize, page * pageSize)
      total = mockResult.total
    }

    return NextResponse.json({
      data: payments,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Error in GET /api/payments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
