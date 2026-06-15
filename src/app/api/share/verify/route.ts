import { NextResponse } from 'next/server'

interface VerifyResponse {
  valid: boolean
  role?: string
  scope?: Record<string, unknown>
  expiresAt?: string
  error?: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ valid: false, error: 'Missing token' })
  }

  try {
    const prisma = (await import('@/lib/prisma')).default
    const shareToken = await prisma.shareToken.findUnique({
      where: { token },
    })

    if (!shareToken) {
      return NextResponse.json({ valid: false, error: 'Token not found' })
    }

    if (shareToken.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, error: 'Token expired' })
    }

    let scope = {}
    try {
      scope = JSON.parse(shareToken.scopeJson)
    } catch {
      scope = {}
    }

    return NextResponse.json({
      valid: true,
      role: shareToken.role,
      scope,
      expiresAt: shareToken.expiresAt.toISOString(),
    } as VerifyResponse)
  } catch {
    return NextResponse.json({ valid: false, error: 'Database error' })
  }
}
