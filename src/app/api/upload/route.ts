import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { nanoid } from 'nanoid'
import { getCurrentUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Papa from 'papaparse'

interface UploadResult {
  fileName: string
  fileUrl: string
  importType: string
  totalRows: number
  successRows: number
  errorRows: number
  errors?: Array<{ row: number; field?: string; ticket_no?: string; message?: string; reason?: string }>
  linkedTickets?: number
}

function parseCsvRows(content: string): any[] {
  return new Promise((resolve, reject) => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error: unknown) => reject(error instanceof Error ? error : new Error(String(error))),
    })
  }) as any as any[]
}

async function processErpImport(
  rows: any[],
  currentUserId: string,
  fileName: string
): Promise<Omit<UploadResult, 'fileName' | 'fileUrl' | 'importType'>> {
  const REQUIRED_FIELDS = ['title', 'department', 'description']
  const errors: Array<{ row: number; field: string; message: string }> = []
  const createdTicketIds: string[] = []

  const users = await prisma.user.findMany()
  const userEmailMap = new Map(users.map((u) => [u.email, u.id]))

  const result = await prisma.$transaction(async (tx) => {
    const importRecord = await tx.importRecord.create({
      data: {
        type: 'erp_export',
        fileName,
        fileUrl: '',
        totalRows: rows.length,
        successRows: 0,
        errorRows: 0,
      },
    })

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 1

      for (const field of REQUIRED_FIELDS) {
        if (!row[field] || String(row[field]).trim() === '') {
          errors.push({ row: rowNum, field, message: '必填字段不能为空' })
        }
      }

      if (errors.some((e) => e.row === rowNum)) continue

      try {
        let assigneeId: string | undefined
        if (row.assignee_email && userEmailMap.has(row.assignee_email)) {
          assigneeId = userEmailMap.get(row.assignee_email)
        } else if (users.length > 0) {
          assigneeId = users[Math.floor(Math.random() * users.length)].id
        }

        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        const ticketNo = `AUD-${year}${month}-${random}`

        const ticket = await tx.ticket.create({
          data: {
            ticketNo,
            title: String(row.title).trim(),
            description: String(row.description || '').trim(),
            department: String(row.department || '').trim(),
            status: 'pending_remediation',
            assigneeId,
            auditorId: currentUserId,
            dueDate: row.due_date ? new Date(row.due_date) : null,
            firstResolution: false,
          },
        })

        await tx.remediationLog.create({
          data: {
            ticketId: ticket.id,
            action: '从ERP导入创建',
            description: `从文件 ${fileName} 导入创建`,
            operatorId: currentUserId,
          },
        })

        if (row.evidence_email) {
          await tx.emailMaterial.create({
            data: {
              ticketId: ticket.id,
              subject: `ERP导出证据 - ${row.title}`,
              sender: 'erp-system@company.com',
              recipients: row.assignee_email || 'auditor@company.com',
              sentAt: new Date(),
              bodyPreview: String(row.evidence_email || ''),
              attachmentUrls: row.attachments ? String(row.attachments) : undefined,
            },
          })
        }

        createdTicketIds.push(ticket.id)
      } catch (rowError) {
        errors.push({
          row: rowNum,
          field: 'system',
          message: rowError instanceof Error ? rowError.message : '创建失败',
        })
      }
    }

    const successRows = createdTicketIds.length
    const errorRows = rows.length - successRows

    await tx.importRecord.update({
      where: { id: importRecord.id },
      data: { successRows, errorRows, fileUrl: `/uploads/${fileName}` },
    })

    return { totalRows: rows.length, successRows, errorRows }
  })

  return { ...result, errors }
}

async function processPermissionLogImport(
  rows: any[],
  currentUserId: string,
  fileName: string,
  format: string
): Promise<Omit<UploadResult, 'fileName' | 'fileUrl' | 'importType'>> {
  const tickets = await prisma.ticket.findMany({
    select: { id: true, ticketNo: true },
  })
  const ticketMap = new Map(tickets.map((t) => [t.ticketNo, t.id]))

  const errors: Array<{ row: number; ticket_no: string; reason: string }> = []
  let linkedCount = 0

  const result = await prisma.$transaction(async (tx) => {
    const importRecord = await tx.importRecord.create({
      data: {
        type: 'permission_log',
        fileName,
        fileUrl: '',
        totalRows: rows.length,
        successRows: 0,
        errorRows: 0,
      },
    })

    for (let i = 0; i < rows.length; i++) {
      const record = rows[i]
      const ticketNo = record.ticket_no?.trim()

      if (!ticketNo) {
        errors.push({ row: i + 1, ticket_no: '', reason: '缺少 ticket_no 字段' })
        continue
      }

      const ticketId = ticketMap.get(ticketNo)
      if (!ticketId) {
        errors.push({ row: i + 1, ticket_no: ticketNo, reason: `工单号 "${ticketNo}" 在系统中不存在` })
        continue
      }

      try {
        const subject = record.action
          ? `权限日志 - ${record.action} - ${record.resource || '未知资源'}`
          : '权限日志记录'

        const bodyPreview = [
          record.timestamp && `时间：${record.timestamp}`,
          record.user_email && `用户：${record.user_email}`,
          record.ip_address && `IP：${record.ip_address}`,
          record.status && `状态：${record.status}`,
          record.details && `详情：${record.details}`,
        ]
          .filter(Boolean)
          .join('\n')

        await tx.emailMaterial.create({
          data: {
            ticketId,
            subject,
            sender: 'permission-audit@company.com',
            recipients: record.user_email || 'compliance@company.com',
            sentAt: record.timestamp ? new Date(record.timestamp) : new Date(),
            bodyPreview,
            attachmentUrls: `/uploads/${fileName}`,
            storagePath: `/imports/permission/${importRecord.id}/${ticketNo}.${format}`,
          },
        })

        linkedCount++
      } catch (recordError) {
        errors.push({
          row: i + 1,
          ticket_no: ticketNo,
          reason: recordError instanceof Error ? recordError.message : '写入失败',
        })
      }
    }

    const errorRows = errors.length

    await tx.importRecord.update({
      where: { id: importRecord.id },
      data: { successRows: linkedCount, errorRows, fileUrl: `/uploads/${fileName}` },
    })

    return { totalRows: rows.length, linkedCount, errorRows }
  })

  return {
    totalRows: result.totalRows,
    successRows: result.linkedCount,
    errorRows: result.errorRows,
    linkedTickets: result.linkedCount,
    errors,
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId(request)
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const importType = formData.get('importType') as string | null

    if (!file) {
      return NextResponse.json({ error: '请选择要上传的文件' }, { status: 400 })
    }

    if (!importType || !['erp_export', 'permission_log'].includes(importType)) {
      return NextResponse.json({ error: '请选择导入类型' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop()?.toLowerCase() || 'csv'
    const safeName = `${nanoid(12)}.${ext}`
    const uploadDir = join(process.cwd(), 'public', 'uploads')

    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, safeName), buffer)

    const fileUrl = `/uploads/${safeName}`
    const content = buffer.toString('utf-8')

    let rows: any[]
    try {
      rows = await parseCsvRows(content)
    } catch {
      return NextResponse.json({ error: '文件解析失败，请确认CSV格式正确' }, { status: 400 })
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: '文件内容为空' }, { status: 400 })
    }

    let result: UploadResult

    if (importType === 'erp_export') {
      const processed = await processErpImport(rows, currentUserId, file.name)
      result = {
        fileName: file.name,
        fileUrl,
        importType: 'erp_export',
        ...processed,
      }
    } else {
      const processed = await processPermissionLogImport(rows, currentUserId, file.name, ext)
      result = {
        fileName: file.name,
        fileUrl,
        importType: 'permission_log',
        ...processed,
      }
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '上传失败' },
      { status: 500 }
    )
  }
}
