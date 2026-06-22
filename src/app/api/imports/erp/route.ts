import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import type { ErpImportRequest, ErpImportResponse } from '@/lib/types'
import { getCurrentUserId } from '@/lib/auth'

const REQUIRED_FIELDS = ['title', 'department', 'description']
const OPTIONAL_FIELDS = ['assignee_email', 'due_date', 'priority', 'category']

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  const parsed = new Date(dateStr)
  return isNaN(parsed.getTime()) ? null : parsed
}

function generateTicketNo(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `AUD-${year}${month}-${random}`
}

async function parseCsvContent(content: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data)
      },
      error: (error: unknown) => {
        reject(error instanceof Error ? error : new Error(String(error)))
      },
    })
  })
}

async function fetchFileContent(fileUrl: string): Promise<string> {
  try {
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`无法获取文件: ${response.status}`)
    }
    return await response.text()
  } catch (error) {
    console.error('Error fetching file:', error)
    throw new Error('文件获取失败')
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId(request)
    const body = (await request.json()) as ErpImportRequest

    if (!body.fileUrl) {
      return NextResponse.json({ error: '文件地址不能为空' }, { status: 400 })
    }

    const fileContent = await fetchFileContent(body.fileUrl)
    let rows: any[] = []

    try {
      rows = await parseCsvContent(fileContent)
    } catch (parseError) {
      return NextResponse.json({ error: 'CSV文件解析失败' }, { status: 400 })
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: '文件内容为空' }, { status: 400 })
    }

    const errors: Array<{ row: number; field: string; message: string }> = []
    const createdTicketIds: string[] = []

    const users = await prisma.user.findMany()
    const userEmailMap = new Map(users.map((u) => [u.email, u.id]))

    const result = await prisma.$transaction(async (tx) => {
      const importRecord = await tx.importRecord.create({
        data: {
          type: 'erp_export',
          fileName: body.fileUrl.split('/').pop() ?? 'erp_export.csv',
          fileUrl: body.fileUrl,
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

        if (errors.some((e) => e.row === rowNum)) {
          continue
        }

        try {
          let assigneeId: string | undefined
          if (row.assignee_email && userEmailMap.has(row.assignee_email)) {
            assigneeId = userEmailMap.get(row.assignee_email)
          } else if (users.length > 0) {
            assigneeId = users[Math.floor(Math.random() * users.length)].id
          }

          const ticket = await tx.ticket.create({
            data: {
              ticketNo: generateTicketNo(),
              title: String(row.title).trim(),
              description: String(row.description || '').trim(),
              department: String(row.department || '').trim(),
              status: 'pending_remediation',
              assigneeId,
              auditorId: currentUserId,
              dueDate: parseDate(row.due_date),
              firstResolution: false,
            },
          })

          await tx.remediationLog.create({
            data: {
              ticketId: ticket.id,
              action: '从ERP导入创建',
              description: `从ERP导出文件导入创建，来源：${body.fileUrl.split('/').pop()}`,
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
        data: {
          successRows,
          errorRows,
        },
      })

      return { importRecord, successRows, errorRows }
    })

    const response: ErpImportResponse = {
      importId: result.importRecord.id,
      totalRows: rows.length,
      successRows: result.successRows,
      errorRows: result.errorRows,
      errors,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('ERP import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ERP导入失败' },
      { status: 500 }
    )
  }
}
