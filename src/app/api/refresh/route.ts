import { NextResponse } from 'next/server'

export async function POST() {
  let lastRefreshedAt = new Date().toISOString()
  let dataUpdatedAt = new Date().toISOString()
  try {
    const prisma = (await import('@/lib/prisma')).default
    const newLog = await prisma.refreshLog.create({
      data: { triggeredBy: 'manual' },
    })
    lastRefreshedAt = newLog.refreshedAt.toISOString()
    dataUpdatedAt = newLog.refreshedAt.toISOString()
  } catch {
    lastRefreshedAt = new Date().toISOString()
    dataUpdatedAt = new Date().toISOString()
  }

  return NextResponse.json({
    lastRefreshedAt,
    dataUpdatedAt,
  })
}

export async function GET() {
  let lastRefreshedAt = new Date().toISOString()
  let dataUpdatedAt = new Date().toISOString()
  try {
    const prisma = (await import('@/lib/prisma')).default
    const latestLog = await prisma.refreshLog.findFirst({
      orderBy: { refreshedAt: 'desc' },
    })
    if (latestLog) {
      lastRefreshedAt = latestLog.refreshedAt.toISOString()
      dataUpdatedAt = latestLog.refreshedAt.toISOString()
    }
  } catch {
    lastRefreshedAt = new Date().toISOString()
    dataUpdatedAt = new Date().toISOString()
  }

  return NextResponse.json({
    lastRefreshedAt,
    dataUpdatedAt,
  })
}
