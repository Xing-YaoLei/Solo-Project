import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { Role } from '@/lib/types'
import { filterAdvisorAnomalies } from '@/lib/role-filter'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const role = (searchParams.get('role') || 'admin') as Role
  const department = searchParams.get('department') || undefined
  const advisorId = searchParams.get('advisorId') || undefined
  const studentId = searchParams.get('studentId') || undefined

  try {
    let advisorWhere: Record<string, unknown> = {}
    if (advisorId) {
      advisorWhere.id = advisorId
    } else if (department) {
      advisorWhere.departmentId = department
    }

    const studentAdvisorWhere: Record<string, unknown> = {}
    if (studentId) {
      studentAdvisorWhere.students = { some: { id: studentId } }
      advisorWhere = { ...advisorWhere, ...studentAdvisorWhere }
    }

    const dbAdvisors = await prisma.advisor.findMany({
      include: {
        department: true,
        students: { include: { gradeReviews: true } },
      },
      where: Object.keys(advisorWhere).length > 0 ? advisorWhere : {},
    })

    const data = dbAdvisors.map((a) => {
      let students = a.students
      if (studentId) {
        students = students.filter((s) => s.id === studentId)
      }
      const totalReviews = students.reduce((s, st) => s + st.gradeReviews.length, 0)
      const anomalyCount = students.reduce(
        (s, st) => s + st.gradeReviews.filter((g) => g.reviewedGrade && g.reviewedGrade !== g.originalGrade).length,
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

    const filtered = filterAdvisorAnomalies(data, { role, department, advisorId, studentId })
    return NextResponse.json(filtered)
  } catch (error) {
    console.error('Advisor anomaly API error:', error)
    return NextResponse.json(
      {
        error: '数据加载失败',
        message: error instanceof Error ? error.message : '数据库连接异常',
        data: [],
      },
      { status: 500 }
    )
  }
}
