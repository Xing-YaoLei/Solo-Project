import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { Role } from '@/lib/types'
import { filterTrendData } from '@/lib/role-filter'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const role = (searchParams.get('role') || 'admin') as Role
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
      by: ['semester'],
      where: whereClause,
      _count: { id: true },
      orderBy: { semester: 'asc' },
    })

    const data = dbData.map((d) => ({
      semester: d.semester,
      count: d._count.id,
      riskScore: Math.round(d._count.id * 0.4),
    }))

    const filtered = filterTrendData(data, { role, department, advisorId, studentId })
    return NextResponse.json(filtered)
  } catch (error) {
    console.error('Trend API error:', error)
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
