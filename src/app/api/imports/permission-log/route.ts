import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import type { PermissionLogImportRequest, PermissionLogImportResponse } from '@/lib/types'
import { getCurrentUserId } from '@/lib/auth'

interface PermissionLogRow {
  ticket_no?: string
  user_email?: string
  action?: string
  resource?: string
  timestamp?: string
  ip_address?: string
  status?: string
  details?: string
}

interface MatchResult {
  ticketId: string | null
  reason: string | null
}

async function parseCsvContent(content: string): Promise<PermissionLogRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data as PermissionLogRow[])
      },
      error: (error: unknown) => {
        reject(error instanceof Error ? error : new Error(String(error)))
      },
    })
  })
}

async function parseJsonContent(content: string): Promise<PermissionLogRow[]> {
  try {
    const data = JSON.parse(content)
    if (Array.isArray(data)) {
      return data
    }
    if (data.records && Array.isArray(data.records)) {
      return data.records
    }
    if (data.logs && Array.isArray(data.logs)) {
      return data.logs
    }
    return []
  } catch {
    throw new Error('JSON格式解析失败')
  }
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

function matchTicketToLog(
  log: PermissionLogRow,
  ticketMap: Map<string, string>
): MatchResult {
  if (!log.ticket_no || log.ticket_no.trim() === '') {
    return {
      ticketId: null,
      reason: '缺少 ticket_no 字段，无法匹配工单',
    }
  }

  const ticketId = ticketMap.get(log.ticket_no.trim())
  if (ticketId) {
    return { ticketId, reason: null }
  }

  return {
    ticketId: null,
    reason: `工单号 "${log.ticket_no}" 在系统中不存在`,
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId(request)
    const body = (await request.json()) as PermissionLogImportRequest

    if (!body.fileUrl) {
      return NextResponse.json({ error: '文件地址不能为空' }, { status: 400 })
    }

    const fileContent = await fetchFileContent(body.fileUrl)
    let records: PermissionLogRow[] = []

    try {
      if (body.format === 'csv') {
        records = await parseCsvContent(fileContent)
      } else if (body.format === 'json') {
        records = await parseJsonContent(fileContent)
      } else {
        return NextResponse.json({ error: '不支持的文件格式' }, { status: 400 })
      }
    } catch (parseError) {
      return NextResponse.json(
        { error: parseError instanceof Error ? parseError.message : '文件解析失败' },
        { status: 400 }
      )
    }

    if (records.length === 0) {
      return NextResponse.json({ error: '文件内容为空' }, { status: 400 })
    }

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
          fileName: body.fileUrl.split('/').pop() ?? `permission_log.${body.format}`,
          fileUrl: body.fileUrl,
          totalRows: records.length,
          successRows: 0,
          errorRows: 0,
        },
      })

      for (let i = 0; i < records.length; i++) {
        const record = records[i]
        const matchResult = matchTicketToLog(record, ticketMap)

        if (!matchResult.ticketId) {
          errors.push({
            row: i + 1,
            ticket_no: record.ticket_no || '',
            reason: matchResult.reason || '未知原因',
          })
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
              ticketId: matchResult.ticketId,
              subject,
              sender: 'permission-audit@company.com',
              recipients: record.user_email || 'compliance@company.com',
              sentAt: record.timestamp ? new Date(record.timestamp) : new Date(),
              bodyPreview,
              attachmentUrls: body.fileUrl,
              storagePath: `/imports/permission/${importRecord.id}/${record.ticket_no || 'unknown'}.${body.format}`,
            },
          })

          linkedCount++
        } catch (recordError) {
          errors.push({
            row: i + 1,
            ticket_no: record.ticket_no || '',
            reason: recordError instanceof Error ? recordError.message : '写入失败',
          })
        }
      }

      const errorRows = errors.length

      await tx.importRecord.update({
        where: { id: importRecord.id },
        data: {
          successRows: linkedCount,
          errorRows,
        },
      })

      return { importRecord, linkedCount, errorRows }
    })

    const response: PermissionLogImportResponse = {
      importId: result.importRecord.id,
      totalRecords: records.length,
      linkedTickets: result.linkedCount,
      errors,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Permission log import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '权限日志导入失败' },
      { status: 500 }
    )
  }
}
