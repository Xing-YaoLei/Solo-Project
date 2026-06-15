import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { role, expiryMinutes } = body

  try {
    const prisma = (await import('@/lib/prisma')).default
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + (expiryMinutes || 60) * 60000)
    await prisma.shareToken.create({
      data: {
        token,
        role: role || 'admin',
        scopeJson: JSON.stringify({ role: role || 'admin' }),
        expiresAt,
      },
    })
    return NextResponse.json({ token, role, expiresAt: expiresAt.toISOString(), resourceId: 'dashboard' })
  } catch {
    const token = crypto.randomUUID()
    return NextResponse.json({
      token,
      role,
      expiresAt: new Date(Date.now() + (expiryMinutes || 60) * 60000).toISOString(),
      resourceId: 'dashboard',
    })
  }
}
