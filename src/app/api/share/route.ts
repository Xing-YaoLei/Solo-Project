import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import type { CreateShareRequest, CreateShareResponse, UserRole, SharePage } from '@/lib/types'
import { getCurrentUserId } from '@/lib/auth'

const shareSchema = z.object({
  scope: z.array(z.enum(['auditor', 'business_owner', 'compliance_officer', 'management'])),
  expiresIn: z.number().min(1).max(30),
  page: z.enum(['funnel', 'board', 'ticket']),
  ticketId: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateShareRequest
    const validation = shareSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { scope, expiresIn, page, ticketId } = validation.data
    const currentUserId = await getCurrentUserId(request)

    if (page === 'ticket' && !ticketId) {
      return NextResponse.json(
        { error: '分享工单明细必须指定 ticketId' },
        { status: 400 }
      )
    }

    const token = nanoid(32)
    const expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000)

    const shareLink = await prisma.shareLink.create({
      data: {
        token,
        page,
        allowedRoles: JSON.stringify(scope),
        expiresAt,
        createdById: currentUserId,
        ticketId,
      },
    })

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${token}`

    const response: CreateShareResponse = {
      shareToken: token,
      shareUrl,
      expiresAt: expiresAt.toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating share link:', error)
    return NextResponse.json({ error: '创建分享链接失败' }, { status: 500 })
  }
}
