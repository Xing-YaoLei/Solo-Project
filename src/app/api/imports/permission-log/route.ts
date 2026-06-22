import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { PermissionLogImportRequest, PermissionLogImportResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PermissionLogImportRequest

    if (!body.fileUrl) {
      return NextResponse.json({ error: "文件地址不能为空" }, { status: 400 })
    }

    const totalRecords = Math.floor(Math.random() * 1000) + 200
    const linkedTickets = Math.floor(totalRecords * 0.6)

    const importRecord = await prisma.importRecord.create({
      data: {
        type: "permission_log",
        fileName: body.fileUrl.split("/").pop() ?? `permission_log.${body.format}`,
        fileUrl: body.fileUrl,
        totalRows: totalRecords,
        successRows: linkedTickets,
        errorRows: totalRecords - linkedTickets,
      },
    })

    const response: PermissionLogImportResponse = {
      importId: importRecord.id,
      totalRecords,
      linkedTickets,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "权限日志导入失败" }, { status: 500 })
  }
}
