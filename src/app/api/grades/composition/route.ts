import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const department = searchParams.get('department') || undefined
  const advisorId = searchParams.get('advisorId') || undefined
  const studentId = searchParams.get('studentId') || undefined

  try {
    const whereClause: Record<string, unknown> = {}
    if (studentId) {
      whereClause.studentId = studentId
    } else if (advisorId) {
      whereClause.student = { advisorId }
    } else if (department) {
      whereClause.student = { departmentId: department }
    }

    const dbData = await prisma.gradeReview.groupBy({
      by: ['originalGrade'],
      where: whereClause,
      _count: { id: true },
    })

    const total = dbData.reduce((s, d) => s + d._count.id, 0)
    const colors: Record<string, string> = {
      A: '#10B981', B: '#3B82F6', C: '#F59E0B', D: '#F97316', F: '#EF4444',
    }
    const data = dbData.map((d) => ({
      grade: d.originalGrade,
      count: d._count.id,
      percentage: total > 0 ? Math.round((d._count.id / total) * 100) : 0,
      fill: colors[d.originalGrade] || '#94A3B8',
    }))

    return NextResponse.json(data)
  } catch (error) {
    console.error('Composition API error:', error)
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
