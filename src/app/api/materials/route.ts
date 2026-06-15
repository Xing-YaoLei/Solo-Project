import { NextResponse } from 'next/server'
import type { Role } from '@/lib/types'
import { filterMaterialDetails, filterCampusCardRecords } from '@/lib/role-filter'
import { materialDetails, campusCardRecords } from '@/lib/mock-data'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const role = (searchParams.get('role') || 'admin') as Role
  const department = searchParams.get('department') || undefined

  let materials = materialDetails
  let cardRecords = campusCardRecords
  try {
    const prisma = (await import('@/lib/prisma')).default
    const dbMaterials = await prisma.application.findMany({
      include: { student: true },
      orderBy: { submittedAt: 'desc' },
    })
    if (dbMaterials.length > 0) {
      materials = dbMaterials.map((d, i) => ({
        id: d.id,
        studentName: d.student.name,
        studentId: d.student.studentNo,
        materialType: d.materialType,
        submittedAt: d.submittedAt?.toISOString() || new Date().toISOString(),
        status: (d.status === 'missing' ? '待审核' : d.status === 'pending' ? '审核中' : d.status === 'approved' ? '已通过' : '已退回') as '待审核' | '审核中' | '已通过' | '已退回',
        riskLevel: (i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
      }))
    }

    const dbCards = await prisma.campusCardRecord.findMany({
      include: { student: true },
      orderBy: { transactionTime: 'desc' },
    })
    if (dbCards.length > 0) {
      cardRecords = dbCards.map((d) => ({
        id: d.id,
        studentId: d.student.studentNo,
        studentName: d.student.name,
        location: d.location,
        timestamp: d.transactionTime.toISOString(),
        isAnomaly: d.amount === 0 || d.transactionTime.getHours() >= 22,
      }))
    }
  } catch {
    materials = materialDetails
    cardRecords = campusCardRecords
  }

  const filteredMaterials = filterMaterialDetails(materials, { role, department })
  const filteredCards = filterCampusCardRecords(cardRecords, { role, department })
  return NextResponse.json({
    materialDetails: filteredMaterials,
    campusCardRecords: filteredCards,
  })
}
