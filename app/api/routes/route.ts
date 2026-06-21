import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getRouteList } from '@/lib/mockData'

export async function GET() {
  try {
    let routes: { id: string; name: string }[]

    try {
      const result = await prisma.order.findMany({
        distinct: ['routeId', 'routeName'],
        select: { routeId: true, routeName: true },
        where: { routeId: { not: null }, routeName: { not: null } },
      })
      routes = result
        .map(r => ({ id: r.routeId!, name: r.routeName! }))
        .filter((r, i, arr) => arr.findIndex(x => x.id === r.id) === i)
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
