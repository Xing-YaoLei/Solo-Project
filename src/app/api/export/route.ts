import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'
import prisma from '@/lib/prisma'

const CALIBER_NOTE = `教室利用率口径说明：
本报告所涉教室利用率数据来源于教务系统排课记录与一卡通门禁签到数据。
利用率 = 实际使用课时 / 排课总课时 × 100%。
其中实际使用课时以一卡通签到记录为准，签到时间与排课时间匹配度≥80%视为有效使用。
统计周期为自然学期，不含补课与临时借用。`

interface ExportBody {
  format?: 'xlsx' | 'pdf' | 'excel'
  role?: string
  department?: string
  advisorId?: string
  studentId?: string
  includeCaliberNote?: boolean
  dateRange?: { start?: string; end?: string }
}

async function getDashboardData(
  role: string,
  department?: string,
  advisorId?: string,
  studentId?: string
) {
  const gradeReviewWhere: Record<string, unknown> = {}
  if (studentId) {
    gradeReviewWhere.studentId = studentId
  } else if (advisorId) {
    gradeReviewWhere.student = { advisorId }
  } else if (department) {
    gradeReviewWhere.student = { departmentId: department }
  }

  const applicationWhere: Record<string, unknown> = {}
  if (studentId) {
    applicationWhere.studentId = studentId
  } else if (advisorId) {
    applicationWhere.student = { advisorId }
  } else if (department) {
    applicationWhere.student = { departmentId: department }
  }

  const advisorWhere: Record<string, unknown> = {}
  if (advisorId) {
    advisorWhere.id = advisorId
  } else if (department) {
    advisorWhere.departmentId = department
  }
  if (studentId) {
    advisorWhere.students = { some: { id: studentId } }
  }

  const [trend, composition, materials, advisors] = await Promise.all([
    prisma.gradeReview.groupBy({
      by: ['semester'],
      where: gradeReviewWhere,
      _count: { id: true },
      orderBy: { semester: 'asc' },
    }),
    prisma.gradeReview.groupBy({
      by: ['originalGrade'],
      where: gradeReviewWhere,
      _count: { id: true },
    }),
    prisma.application.findMany({
      include: { student: true },
      where: Object.keys(applicationWhere).length > 0 ? applicationWhere : undefined,
      orderBy: { submittedAt: 'desc' },
      take: 50,
    }),
    prisma.advisor.findMany({
      include: {
        department: true,
        students: { include: { gradeReviews: true } },
      },
      where: Object.keys(advisorWhere).length > 0 ? advisorWhere : undefined,
    }),
  ])

  const compTotal = composition.reduce((s, c) => s + c._count.id, 0)

  return {
    trend: trend.map((d) => ({
      semester: d.semester,
      count: d._count.id,
      riskScore: Math.round(d._count.id * 0.4),
    })),
    composition: composition.map((d) => ({
      grade: d.originalGrade,
      count: d._count.id,
      percentage: compTotal > 0 ? Math.round((d._count.id / compTotal) * 100) : 0,
    })),
    materials: materials.map((d) => ({
      studentName: d.student.name,
      studentNo: d.student.studentNo,
      materialType: d.materialType,
      status:
        d.status === 'missing' ? '待审核' :
        d.status === 'pending' ? '审核中' :
        d.status === 'approved' ? '已通过' : '已退回',
      riskLevel:
        d.status === 'missing' ? '高' :
        d.status === 'pending' ? '中' : '低',
      submittedAt: d.submittedAt ? new Date(d.submittedAt).toLocaleString('zh-CN') : '-',
    })),
    advisors: advisors.map((a) => {
      const filteredStudents = studentId
        ? a.students.filter((s) => s.id === studentId)
        : a.students
      const totalReviews = filteredStudents.reduce((s, st) => s + st.gradeReviews.length, 0)
      const anomalyCount = filteredStudents.reduce(
        (s, st) =>
          s + st.gradeReviews.filter((g) => g.reviewedGrade && g.reviewedGrade !== g.originalGrade).length,
        0
      )
      return {
        advisorName: a.name,
        department: a.department.name,
        studentCount: filteredStudents.length,
        totalReviews,
        anomalyCount,
        anomalyRate: totalReviews > 0 ? Math.round((anomalyCount / totalReviews) * 1000) / 10 : 0,
      }
    }),
  }
}

const roleLabels: Record<string, string> = {
  admin: '教务管理员（全部）',
  dean: '院系领导',
  advisor: '导师',
  student: '学生',
}

export async function POST(request: Request) {
  const body: ExportBody = await request.json()
  const {
    format = 'xlsx',
    role = 'admin',
    department,
    advisorId,
    studentId,
    includeCaliberNote = true,
  } = body

  try {
    const data = await getDashboardData(role, department, advisorId, studentId)
    const nowStr = new Date().toLocaleString('zh-CN')
    const roleLabel = roleLabels[role] || '教务管理员（全部）'

    const scopeParts: string[] = []
    if (studentId) scopeParts.push('特定学生')
    else if (advisorId) scopeParts.push('特定导师')
    else if (department) scopeParts.push('特定院系')
    const scopeLabel = scopeParts.length > 0 ? `${roleLabel}（${scopeParts.join('、')}）` : roleLabel

    if (format === 'pdf') {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 40
      let y = margin

      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('成绩复核风险监测报告', pageWidth / 2, y, { align: 'center' })
      y += 30

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`生成时间：${nowStr}`, margin, y)
      y += 14
      doc.text(`角色范围：${scopeLabel}`, margin, y)
      y += 25

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('一、复核申请趋势', margin, y)
      y += 20

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      if (data.trend.length === 0) {
        doc.text('（暂无数据）', margin + 10, y)
        y += 18
      } else {
        data.trend.forEach((item) => {
          if (y > 750) {
            doc.addPage()
            y = margin
          }
          doc.text(`${item.semester}：${item.count} 人（风险分：${item.riskScore}）`, margin + 10, y)
          y += 18
        })
      }
      y += 10

      if (y > 700) {
        doc.addPage()
        y = margin
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('二、成绩等级分布', margin, y)
      y += 20

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      if (data.composition.length === 0) {
        doc.text('（暂无数据）', margin + 10, y)
        y += 18
      } else {
        data.composition.forEach((item) => {
          if (y > 750) {
            doc.addPage()
            y = margin
          }
          doc.text(`${item.grade} 级：${item.count} 人（占 ${item.percentage}%）`, margin + 10, y)
          y += 18
        })
      }
      y += 10

      if (y > 650) {
        doc.addPage()
        y = margin
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('三、申请材料明细', margin, y)
      y += 20

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      if (data.materials.length === 0) {
        doc.text('（暂无数据）', margin + 10, y)
        y += 18
      } else {
        const displayMaterials = data.materials.slice(0, 15)
        displayMaterials.forEach((item) => {
          if (y > 750) {
            doc.addPage()
            y = margin
          }
          doc.text(`${item.studentName}（${item.studentNo}）- ${item.materialType} - ${item.status} - 风险${item.riskLevel}`, margin + 10, y)
          y += 18
        })
        if (data.materials.length > 15) {
          doc.text(`... 共 ${data.materials.length} 条，显示前 15 条`, margin + 10, y)
          y += 18
        }
      }
      y += 10

      if (y > 600) {
        doc.addPage()
        y = margin
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('四、导师异常监测', margin, y)
      y += 20

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      if (data.advisors.length === 0) {
        doc.text('（暂无数据）', margin + 10, y)
        y += 18
      } else {
        data.advisors.slice(0, 10).forEach((item) => {
          if (y > 750) {
            doc.addPage()
            y = margin
          }
          doc.text(`${item.advisorName}（${item.department}）- 学生数：${item.studentCount} - 异常率：${item.anomalyRate}%`, margin + 10, y)
          y += 18
        })
      }
      y += 15

      if (includeCaliberNote) {
        if (y > 680) {
          doc.addPage()
          y = margin
        }
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('【教室利用率口径说明】', margin, y)
        y += 20

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        const lines = CALIBER_NOTE.split('\n')
        lines.forEach((line) => {
          if (y > 780) {
            doc.addPage()
            y = margin
          }
          doc.text(line, margin, y)
          y += 16
        })
      }

      const pdfBuffer = doc.output('arraybuffer')

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="成绩复核风险监测报告_${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      })
    }

    const workbook = new ExcelJS.Workbook()
    workbook.creator = '成绩复核风险监测系统'
    workbook.created = new Date()

    const trendSheet = workbook.addWorksheet('复核申请趋势')
    trendSheet.columns = [
      { header: '学期', key: 'semester', width: 20 },
      { header: '申请人数', key: 'count', width: 12 },
      { header: '风险评分', key: 'riskScore', width: 12 },
    ]
    data.trend.forEach((row) => trendSheet.addRow(row))
    trendSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B2A4A' } }
    trendSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true }

    const compSheet = workbook.addWorksheet('成绩等级分布')
    compSheet.columns = [
      { header: '等级', key: 'grade', width: 10 },
      { header: '人数', key: 'count', width: 12 },
      { header: '占比(%)', key: 'percentage', width: 12 },
    ]
    data.composition.forEach((row) => compSheet.addRow(row))
    compSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B2A4A' } }
    compSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true }

    const matSheet = workbook.addWorksheet('申请材料明细')
    matSheet.columns = [
      { header: '学生姓名', key: 'studentName', width: 12 },
      { header: '学号', key: 'studentNo', width: 14 },
      { header: '材料类型', key: 'materialType', width: 16 },
      { header: '状态', key: 'status', width: 10 },
      { header: '风险等级', key: 'riskLevel', width: 10 },
      { header: '提交时间', key: 'submittedAt', width: 20 },
    ]
    data.materials.forEach((row) => matSheet.addRow(row))
    matSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B2A4A' } }
    matSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true }

    const advSheet = workbook.addWorksheet('导师异常监测')
    advSheet.columns = [
      { header: '导师姓名', key: 'advisorName', width: 12 },
      { header: '所属院系', key: 'department', width: 16 },
      { header: '学生数', key: 'studentCount', width: 10 },
      { header: '复核总数', key: 'totalReviews', width: 12 },
      { header: '异常数', key: 'anomalyCount', width: 10 },
      { header: '异常率(%)', key: 'anomalyRate', width: 12 },
    ]
    data.advisors.forEach((row) => advSheet.addRow(row))
    advSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B2A4A' } }
    advSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true }

    if (includeCaliberNote) {
      const noteSheet = workbook.addWorksheet('口径说明')
      noteSheet.columns = [{ header: '教室利用率口径说明', key: 'note', width: 80 }]
      noteSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } }
      noteSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 12 }

      const lines = CALIBER_NOTE.split('\n')
      lines.forEach((line) => {
        noteSheet.addRow({ note: line })
      })

      noteSheet.getColumn('note').alignment = { wrapText: true, vertical: 'top' }
    }

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="成绩复核风险监测报告_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json(
      {
        error: '导出失败',
        message: error instanceof Error ? error.message : '数据库连接异常',
      },
      { status: 500 }
    )
  }
}
