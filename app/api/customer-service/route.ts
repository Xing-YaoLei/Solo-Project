import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getMockCustomerServiceRecords } from '@/lib/mockData'
import type { CustomerServiceRecord } from '@/types'

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

    let records: CustomerServiceRecord[]
    let total: number

    try {
      const where: any = {}
      if (orderId) where.orderId = orderId

      const [result, count] = await Promise.all([
        prisma.customerServiceRecord.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: { order: { select: { orderNo: true, routeName: true } } },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.customerServiceRecord.count({ where }),
      ])
      records = result as unknown as CustomerServiceRecord[]
      total = count
    } catch (dbError) {
      console.warn('Database connection failed, using mock data:', dbError)
      const mockResult = getMockCustomerServiceRecords(orderId)
      records = mockResult.data.slice((page - 1) * pageSize, page * pageSize)
      total = mockResult.total
    }

    return NextResponse.json({
      data: records,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Error in GET /api/customer-service:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
