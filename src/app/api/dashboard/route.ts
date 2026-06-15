import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { Role } from '@/lib/types'
import { filterTrendData, filterGradeComposition, filterMaterialDetails, filterCampusCardRecords, filterAdvisorAnomalies } from '@/lib/role-filter'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const role = (searchParams.get('role') || 'admin') as Role
  const department = searchParams.get('department') || undefined
  const advisorId = searchParams.get('advisorId') || undefined
  const studentId = searchParams.get('studentId') || undefined

  const scope = { role, department, advisorId, studentId }

  try {
    const colors: Record<string, string> = {
      A: '#10B981', B: '#3B82F6', C: '#F59E0B', D: '#F97316', F: '#EF4444',
    }

    const whereClause: Record<string, unknown> = {}
    if (studentId) {
      whereClause.studentId = studentId
    } else if (advisorId) {
      whereClause.student = { advisorId }
    } else if (department) {
      whereClause.student = { departmentId: department }
    }

    const [dbTrend, dbComposition, dbMaterials, dbCards, dbAdvisors] = await Promise.all([
      prisma.gradeReview.groupBy({
        by: ['semester'],
        where: whereClause,
        _count: { id: true },
        orderBy: { semester: 'asc' },
      }),
      prisma.gradeReview.groupBy({
        by: ['originalGrade'],
        where: whereClause,
        _count: { id: true },
      }),
      prisma.application.findMany({
        include: { student: true },
        where: advisorId
          ? { student: { advisorId } }
          : department
          ? { student: { departmentId: department } }
          : studentId
          ? { studentId }
          : {},
        orderBy: { submittedAt: 'desc' },
      }),
      prisma.campusCardRecord.findMany({
        include: { student: true },
        where: advisorId
          ? { student: { advisorId } }
          : department
          ? { student: { departmentId: department } }
          : studentId
          ? { studentId }
          : {},
        orderBy: { transactionTime: 'desc' },
        take: 100,
      }),
      prisma.advisor.findMany({
        include: {
          department: true,
          students: { include: { gradeReviews: true } },
        },
        where: department ? { departmentId: department } : advisorId ? { id: advisorId } : {},
      }),
    ])

    const trend = dbTrend.map((d) => ({
      semester: d.semester,
      count: d._count.id,
      riskScore: Math.round(d._count.id * 0.4),
    }))

    const compTotal = dbComposition.reduce((s, d) => s + d._count.id, 0)
    const composition = dbComposition.map((d) => ({
      grade: d.originalGrade,
      count: d._count.id,
      percentage: compTotal > 0 ? Math.round((d._count.id / compTotal) * 100) : 0,
      fill: colors[d.originalGrade] || '#94A3B8',
    }))

    const materials = dbMaterials.map((d) => ({
      id: d.id,
      studentName: d.student.name,
      studentId: d.student.studentNo,
      materialType: d.materialType,
      submittedAt: d.submittedAt?.toISOString() || new Date().toISOString(),
      status: (
        d.status === 'missing' ? '待审核' :
        d.status === 'pending' ? '审核中' :
        d.status === 'approved' ? '已通过' : '已退回'
      ) as '待审核' | '审核中' | '已通过' | '已退回',
      riskLevel: (
        d.status === 'missing' ? 'high' :
        d.status === 'pending' ? 'medium' : 'low'
      ) as 'low' | 'medium' | 'high',
    }))

    const cards = dbCards.map((d) => ({
      id: d.id,
      studentId: d.student.studentNo,
      studentName: d.student.name,
      location: d.location,
      timestamp: d.transactionTime.toISOString(),
      isAnomaly: d.amount === 0 || d.transactionTime.getHours() >= 22,
    }))

    const anomalies = dbAdvisors.map((a) => {
      const totalReviews = a.students.reduce((s, st) => s + st.gradeReviews.length, 0)
      const anomalyCount = a.students.reduce(
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

    return NextResponse.json({
      trend: filterTrendData(trend, scope),
      composition: filterGradeComposition(composition, scope),
      materials: filterMaterialDetails(materials, scope),
      campusCards: filterCampusCardRecords(cards, scope),
      anomalies: filterAdvisorAnomalies(anomalies, scope),
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      {
        error: '数据加载失败',
        message: error instanceof Error ? error.message : '数据库连接异常',
        trend: [],
        composition: [],
        materials: [],
        campusCards: [],
        anomalies: [],
      },
      { status: 500 }
    )
  }
}
