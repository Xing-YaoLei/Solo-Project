import { NextResponse } from 'next/server'
import type { Role } from '@/lib/types'
import { filterTrendData } from '@/lib/role-filter'
import { trendData } from '@/lib/mock-data'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const role = (searchParams.get('role') || 'admin') as Role
  const department = searchParams.get('department') || undefined

  let data = trendData
  try {
    const prisma = (await import('@/lib/prisma')).default
    const dbData = await prisma.gradeReview.groupBy({
      by: ['semester'],
      _count: { id: true },
      orderBy: { semester: 'asc' },
    })
    if (dbData.length > 0) {
      data = dbData.map((d) => ({
        semester: d.semester,
        count: d._count.id,
        riskScore: Math.round(d._count.id * 0.4),
      }))
    }
  } catch {
    data = trendData
  }

  const filtered = filterTrendData(data, { role, department })
  return NextResponse.json(filtered)
}
