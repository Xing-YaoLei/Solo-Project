import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { Role } from '@/lib/types'

export async function POST(request: Request) {
  const body = await request.json()
  const {
    role = 'admin',
    expiryMinutes = 60,
    departmentId,
    advisorId,
    studentId,
  }: {
    role?: Role
    expiryMinutes?: number
    departmentId?: string
    advisorId?: string
    studentId?: string
  } = body

  try {
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + expiryMinutes * 60000)

    const scopeData: Record<string, unknown> = { role }
    if (departmentId) scopeData.department = departmentId
    if (advisorId) scopeData.advisorId = advisorId
    if (studentId) scopeData.studentId = studentId

    const shareToken = await prisma.shareToken.create({
      data: {
        token,
        role,
        departmentId: departmentId || null,
        advisorId: advisorId || null,
        studentId: studentId || null,
        scopeJson: JSON.stringify(scopeData),
        expiresAt,
      },
    })

    return NextResponse.json({
      token,
      role,
      departmentId: shareToken.departmentId,
      advisorId: shareToken.advisorId,
      studentId: shareToken.studentId,
      expiresAt: expiresAt.toISOString(),
      resourceId: 'dashboard',
    })
  } catch (error) {
    console.error('Share create error:', error)
    return NextResponse.json(
      {
        error: '分享链接创建失败',
        message: error instanceof Error ? error.message : '数据库异常',
      },
      { status: 500 }
    )
  }
}
