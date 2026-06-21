import { NextResponse } from 'next/server'
import { z } from 'zod'
import { FunnelService } from '@/services/FunnelService'
import { generateMockFunnelData } from '@/lib/mockData'

const querySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  routeId: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const routeId = searchParams.get('routeId') || undefined

    const validated = querySchema.safeParse({ startDate, endDate, routeId })
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validated.error },
        { status: 400 }
      )
    }

    let data
    try {
      data = await FunnelService.getFunnelData(validated.data)
    } catch (dbError) {
      console.warn('Database connection failed, using mock data:', dbError)
      data = generateMockFunnelData(validated.data)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/funnel:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
