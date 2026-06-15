import { NextResponse } from 'next/server'
import type { Role } from '@/lib/types'
import { filterGradeComposition } from '@/lib/role-filter'
import { gradeComposition } from '@/lib/mock-data'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const role = (searchParams.get('role') || 'admin') as Role
  const department = searchParams.get('department') || undefined

  let data = gradeComposition
  try {
    const prisma = (await import('@/lib/prisma')).default
    const dbData = await prisma.gradeReview.groupBy({
      by: ['originalGrade'],
      _count: { id: true },
    })
    if (dbData.length > 0) {
      const total = dbData.reduce((s, d) => s + d._count.id, 0)
      const colors: Record<string, string> = {
        A: '#10B981', B: '#3B82F6', C: '#F59E0B', D: '#F97316', F: '#EF4444',
      }
      data = dbData.map((d) => ({
        grade: d.originalGrade,
        count: d._count.id,
        percentage: Math.round((d._count.id / total) * 100),
        fill: colors[d.originalGrade] || '#94A3B8',
      }))
    }
  } catch {
    data = gradeComposition
  }

  const filtered = filterGradeComposition(data, { role, department })
  return NextResponse.json(filtered)
}
