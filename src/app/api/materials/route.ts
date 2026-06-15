import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const department = searchParams.get('department') || undefined
  const advisorId = searchParams.get('advisorId') || undefined
  const studentId = searchParams.get('studentId') || undefined

  try {
    const studentWhere = advisorId
      ? { advisorId }
      : department
      ? { departmentId: department }
      : {}

    const [dbMaterials, dbCards] = await Promise.all([
      prisma.application.findMany({
        include: { student: true },
        where: studentId
          ? { studentId }
          : Object.keys(studentWhere).length > 0
          ? { student: studentWhere }
          : {},
        orderBy: { submittedAt: 'desc' },
      }),
      prisma.campusCardRecord.findMany({
        include: { student: true },
        where: studentId
          ? { studentId }
          : Object.keys(studentWhere).length > 0
          ? { student: studentWhere }
          : {},
        orderBy: { transactionTime: 'desc' },
        take: 100,
      }),
    ])

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

    const cardRecords = dbCards.map((d) => ({
      id: d.id,
      studentId: d.student.studentNo,
      studentName: d.student.name,
      location: d.location,
      timestamp: d.transactionTime.toISOString(),
      isAnomaly: d.amount === 0 || d.transactionTime.getHours() >= 22,
    }))

    return NextResponse.json({
      materialDetails: materials,
      campusCardRecords: cardRecords,
    })
  } catch (error) {
    console.error('Materials API error:', error)
    return NextResponse.json(
      {
        error: '数据加载失败',
        message: error instanceof Error ? error.message : '数据库连接异常',
        materialDetails: [],
        campusCardRecords: [],
      },
      { status: 500 }
    )
  }
}
