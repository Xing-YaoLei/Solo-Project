import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getMockOrderDetail } from '@/lib/mockData'
import type { OrderDetail } from '@/types'

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params

    let order: OrderDetail | null

    try {
      const result = await prisma.order.findUnique({
        where: { id },
        include: {
          payment: true,
          appeal: true,
          customerServiceRecs: true,
          tasks: true,
          conclusions: true,
          subsidyRule: true,
        },
      })
      order = result as unknown as OrderDetail | null
    } catch (dbError) {
      console.warn('Database connection failed, using mock data:', dbError)
      order = getMockOrderDetail(id)
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error in GET /api/orders/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
