import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const prisma = (await import('@/lib/prisma')).default
    await prisma.refreshLog.create({
      data: { triggeredBy: 'manual' },
    })
  } catch {}

  return NextResponse.json({
    lastRefreshedAt: new Date().toISOString(),
    dataUpdatedAt: new Date().toISOString(),
  })
}
