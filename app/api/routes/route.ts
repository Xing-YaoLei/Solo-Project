import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getRouteList } from '@/lib/mockData'

interface RouteResult {
  routeId: string | null
  routeName: string | null
}

export async function GET() {
  try {
    let routes: { id: string; name: string }[]

    try {
      const result: RouteResult[] = await prisma.order.findMany({
        distinct: ['routeId', 'routeName'],
        select: { routeId: true, routeName: true },
      })
      routes = result
        .map((r: RouteResult) => ({ id: r.routeId!, name: r.routeName! }))
        .filter((r: { id: string }, i: number, arr: { id: string }[]) => 
          arr.findIndex((x: { id: string }) => x.id === r.id) === i
        )
    } catch (dbError) {
      console.warn('Database connection failed, using mock data:', dbError)
      routes = getRouteList()
    }

    return NextResponse.json({ data: routes })
  } catch (error) {
    console.error('Error in GET /api/routes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
