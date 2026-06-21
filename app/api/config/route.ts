import { NextResponse } from 'next/server'
import { z } from 'zod'
import { FunnelService } from '@/services/FunnelService'
import { getMockSystemConfig, updateMockSystemConfig } from '@/lib/mockData'

const updateSchema = z.object({
  dispatchDurationThreshold: z.number().min(60).max(7200).optional(),
  autoCreateTaskOnTimeout: z.boolean().optional(),
  autoCreateTaskOnDamage: z.boolean().optional(),
})

export async function GET() {
  try {
    let config
    try {
      config = await FunnelService.getSystemConfig()
    } catch (dbError) {
      console.warn('Database connection failed, using mock data:', dbError)
      config = getMockSystemConfig()
    }
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error in GET /api/config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const validated = updateSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validated.error },
        { status: 400 }
      )
    }

    let config
    try {
      config = await FunnelService.updateSystemConfig(validated.data)
    } catch (dbError) {
      console.warn('Database connection failed, using mock data:', dbError)
      config = updateMockSystemConfig(validated.data)
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error in PUT /api/config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
