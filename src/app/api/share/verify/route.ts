import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface VerifyResponse {
  valid: boolean
  role?: string
  departmentId?: string | null
  advisorId?: string | null
  studentId?: string | null
  departmentName?: string | null
  advisorName?: string | null
  studentName?: string | null
  scope?: Record<string, unknown>
  expiresAt?: string
  error?: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ valid: false, error: 'Missing token' } as VerifyResponse, { status: 400 })
  }

  try {
    const shareToken = await prisma.shareToken.findUnique({
      where: { token },
    })

    if (!shareToken) {
      return NextResponse.json({ valid: false, error: '分享链接不存在或已被删除' } as VerifyResponse, { status: 404 })
    }

    if (shareToken.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, error: '分享链接已过期' } as VerifyResponse, { status: 410 })
    }

    let departmentName: string | null = null
    let advisorName: string | null = null
    let studentName: string | null = null

    if (shareToken.departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: shareToken.departmentId },
        select: { name: true },
      })
      departmentName = dept?.name || null
    }
    if (shareToken.advisorId) {
      const adv = await prisma.advisor.findUnique({
        where: { id: shareToken.advisorId },
        select: { name: true },
      })
      advisorName = adv?.name || null
    }
    if (shareToken.studentId) {
      const stu = await prisma.student.findUnique({
        where: { id: shareToken.studentId },
        select: { name: true },
      })
      studentName = stu?.name || null
    }

    let scope: Record<string, unknown> = {}
    try {
      scope = JSON.parse(shareToken.scopeJson)
    } catch {
      scope = {}
    }

    return NextResponse.json({
      valid: true,
      role: shareToken.role,
      departmentId: shareToken.departmentId,
      advisorId: shareToken.advisorId,
      studentId: shareToken.studentId,
      departmentName,
      advisorName,
      studentName,
      scope,
      expiresAt: shareToken.expiresAt.toISOString(),
    } as VerifyResponse)
  } catch (error) {
    console.error('Share verify error:', error)
    return NextResponse.json(
      {
        valid: false,
        error: '验证失败',
        message: error instanceof Error ? error.message : '数据库连接异常',
      } as VerifyResponse,
      { status: 500 }
    )
  }
}
