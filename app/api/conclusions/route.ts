import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ConclusionService } from '@/services/ConclusionService'
import { getMockConclusions, createMockConclusion } from '@/lib/mockData'
import type { Conclusion, ChartType } from '@/types'

const querySchema = z.object({
  chartPointId: z.string().optional(),
  chartType: z.enum(['funnel', 'dispatch_trend', 'payment_trend']).optional(),
  orderId: z.string().optional(),
  taskId: z.string().optional(),
})

const createSchema = z.object({
  orderId: z.string(),
  taskId: z.string().optional(),
  chartPointId: z.string(),
  chartType: z.enum(['funnel', 'dispatch_trend', 'payment_trend']),
  content: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  attachments: z.array(z.string()).optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chartPointId = searchParams.get('chartPointId') || undefined
    const chartType = searchParams.get('chartType') as ChartType | undefined
    const orderId = searchParams.get('orderId') || undefined
    const taskId = searchParams.get('taskId') || undefined

    const validated = querySchema.safeParse({ chartPointId, chartType, orderId, taskId })
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validated.error },
        { status: 400 }
      )
    }

    let conclusions: Conclusion[]

    try {
      if (validated.data.chartPointId && validated.data.chartType) {
        conclusions = await ConclusionService.getConclusionsByChartPoint(
          validated.data.chartPointId,
          validated.data.chartType
        )
      } else if (validated.data.orderId) {
        conclusions = await ConclusionService.getConclusionsByOrder(validated.data.orderId)
      } else if (validated.data.taskId) {
        const conclusion = await ConclusionService.getConclusionsByTask(validated.data.taskId)
        conclusions = conclusion ? [conclusion] : []
      } else {
        conclusions = await ConclusionService.getRecentConclusions(20)
      }
    } catch (dbError) {
      console.warn('Database connection failed, using mock data:', dbError)
      conclusions = getMockConclusions({ chartPointId, chartType, orderId, taskId })
    }

    return NextResponse.json({ data: conclusions })
  } catch (error) {
    console.error('Error in GET /api/conclusions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = createSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validated.error },
        { status: 400 }
      )
    }

    let conclusion: Conclusion

    try {
      conclusion = await ConclusionService.createConclusion(validated.data)
    } catch (dbError) {
      console.warn('Database connection failed, using mock data:', dbError)
      conclusion = createMockConclusion(validated.data)
    }

    return NextResponse.json({ success: true, conclusion }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/conclusions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
