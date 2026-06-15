import { NextResponse } from 'next/server'
import type { Role } from '@/lib/types'
import { filterTrendData, filterGradeComposition, filterMaterialDetails, filterCampusCardRecords, filterAdvisorAnomalies } from '@/lib/role-filter'
import { trendData, gradeComposition, materialDetails, campusCardRecords, advisorAnomalies } from '@/lib/mock-data'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const role = (searchParams.get('role') || 'admin') as Role
  const department = searchParams.get('department') || undefined
  const advisorId = searchParams.get('advisorId') || undefined
  const studentId = searchParams.get('studentId') || undefined

  const scope = { role, department, advisorId, studentId }

  let trend = trendData
  let composition = gradeComposition
  let materials = materialDetails
  let cards = campusCardRecords
  let anomalies = advisorAnomalies

  try {
    const prisma = (await import('@/lib/prisma')).default

    const dbTrend = await prisma.gradeReview.groupBy({
      by: ['semester'],
      _count: { id: true },
      orderBy: { semester: 'asc' },
    })
    if (dbTrend.length > 0) {
      trend = dbTrend.map((d) => ({
        semester: d.semester,
        count: d._count.id,
        riskScore: Math.round(d._count.id * 0.4),
      }))
    }

    const dbComposition = await prisma.gradeReview.groupBy({
      by: ['originalGrade'],
      _count: { id: true },
    })
    if (dbComposition.length > 0) {
      const total = dbComposition.reduce((s, d) => s + d._count.id, 0)
      const colors: Record<string, string> = {
        A: '#10B981', B: '#3B82F6', C: '#F59E0B', D: '#F97316', F: '#EF4444',
      }
      composition = dbComposition.map((d) => ({
        grade: d.originalGrade,
        count: d._count.id,
        percentage: Math.round((d._count.id / total) * 100),
        fill: colors[d.originalGrade] || '#94A3B8',
      }))
    }

    const dbMaterials = await prisma.application.findMany({
      include: { student: true },
      orderBy: { submittedAt: 'desc' },
    })
    if (dbMaterials.length > 0) {
      materials = dbMaterials.map((d, i) => ({
        id: d.id,
        studentName: d.student.name,
        studentId: d.student.studentNo,
        materialType: d.materialType,
        submittedAt: d.submittedAt?.toISOString() || new Date().toISOString(),
        status: (d.status === 'missing' ? '待审核' : d.status === 'pending' ? '审核中' : d.status === 'approved' ? '已通过' : '已退回') as '待审核' | '审核中' | '已通过' | '已退回',
        riskLevel: (i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
      }))
    }

    const dbCards = await prisma.campusCardRecord.findMany({
      include: { student: true },
      orderBy: { transactionTime: 'desc' },
    })
    if (dbCards.length > 0) {
      cards = dbCards.map((d) => ({
        id: d.id,
        studentId: d.student.studentNo,
        studentName: d.student.name,
        location: d.location,
        timestamp: d.transactionTime.toISOString(),
        isAnomaly: d.amount === 0 || d.transactionTime.getHours() >= 22,
      }))
    }

    const dbAdvisors = await prisma.advisor.findMany({
      include: {
        department: true,
        students: {
          include: { gradeReviews: true },
        },
      },
    })
    if (dbAdvisors.length > 0) {
      anomalies = dbAdvisors.map((a) => {
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
    }
  } catch {
    trend = trendData
    composition = gradeComposition
    materials = materialDetails
    cards = campusCardRecords
    anomalies = advisorAnomalies
  }

  return NextResponse.json({
    trend: filterTrendData(trend, scope),
    composition: filterGradeComposition(composition, scope),
    materials: filterMaterialDetails(materials, scope),
    campusCards: filterCampusCardRecords(cards, scope),
    anomalies: filterAdvisorAnomalies(anomalies, scope),
  })
}
