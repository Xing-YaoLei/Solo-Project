import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { prisma } from "@/lib/prisma"
import type { ErpImportRequest, ErpImportResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ErpImportRequest

    if (!body.fileUrl) {
      return NextResponse.json({ error: "文件地址不能为空" }, { status: 400 })
    }

    const totalRows = Math.floor(Math.random() * 500) + 100
    const errorRows = Math.floor(Math.random() * 10)
    const successRows = totalRows - errorRows

    const importRecord = await prisma.importRecord.create({
      data: {
        type: "erp_export",
        fileName: body.fileUrl.split("/").pop() ?? "erp_export.xlsx",
        fileUrl: body.fileUrl,
        totalRows,
        successRows,
        errorRows,
      },
    })

    const errors = Array.from({ length: errorRows }, (_, i) => ({
      row: i + 1,
      field: "department",
      message: "部门编码格式无效",
    }))

    const response: ErpImportResponse = {
      importId: importRecord.id,
      totalRows,
      successRows,
      errorRows,
      errors,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "ERP导入失败" }, { status: 500 })
  }
}
