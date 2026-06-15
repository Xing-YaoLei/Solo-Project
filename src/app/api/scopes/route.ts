import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'departments'
  const departmentId = searchParams.get('departmentId') || undefined
  const advisorId = searchParams.get('advisorId') || undefined

  try {
    if (type === 'departments') {
      const departments = await prisma.department.findMany({
        select: { id: true, name: true, code: true },
        orderBy: { code: 'asc' },
      })
      return NextResponse.json(departments)
    }

    if (type === 'advisors') {
      const advisors = await prisma.advisor.findMany({
        where: departmentId ? { departmentId } : {},
        select: { id: true, name: true, departmentId: true },
        orderBy: { name: 'asc' },
      })
      return NextResponse.json(advisors)
    }

    if (type === 'students') {
      const students = await prisma.student.findMany({
        where: advisorId
          ? { advisorId }
          : departmentId
            ? { departmentId }
            : {},
        select: { id: true, name: true, studentNo: true, advisorId: true },
        orderBy: { studentNo: 'asc' },
      })
      return NextResponse.json(students)
    }

    return NextResponse.json(
      { error: '无效的 type 参数', message: 'type 必须为 departments、advisors 或 students' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Scopes API error:', error)
    return NextResponse.json(
      {
        error: '数据加载失败',
        message: error instanceof Error ? error.message : '数据库连接异常',
      },
      { status: 500 }
    )
  }
}
