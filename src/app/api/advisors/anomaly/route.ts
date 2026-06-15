import { NextResponse } from 'next/server'
import type { Role } from '@/lib/types'
import { filterAdvisorAnomalies } from '@/lib/role-filter'
import { advisorAnomalies } from '@/lib/mock-data'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const role = (searchParams.get('role') || 'admin') as Role
  const department = searchParams.get('department') || undefined
  const advisorId = searchParams.get('advisorId') || undefined

  let data = advisorAnomalies
  try {
    const prisma = (await import('@/lib/prisma')).default
    const dbAdvisors = await prisma.advisor.findMany({
      include: {
        department: true,
        students: {
          include: { gradeReviews: true },
        },
      },
    })
    if (dbAdvisors.length > 0) {
      data = dbAdvisors.map((a) => {
        const totalReviews = a.students.reduce(
          (s, st) => s + st.gradeReviews.length, 0
        )
        const anomalyCount = a.students.reduce(
          (s, st) =>
            s + st.gradeReviews.filter((g) => g.reviewedGrade && g.reviewedGrade !== g.originalGrade).length,
          0
        )
        return {
          advisorId: a.id,
          advisorName: a.name,
          department: a.department.name,
          totalReviews,
          anomalyCount,
          anomalyRate: totalReviews > 0 ? Math.round((anomalyCount / totalReviews) * 1000) / 10 : 0,
          recentAnomalies: anomalyCount > 0 ? ['成绩变更记录'] : [],
        }
      })
    }
  } catch {
    data = advisorAnomalies
  }

  const filtered = filterAdvisorAnomalies(data, { role, department, advisorId })
  return NextResponse.json(filtered)
}
