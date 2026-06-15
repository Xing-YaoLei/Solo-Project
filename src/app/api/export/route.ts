import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { format, dateRange, filters, includeCaliberNote } = body
  return NextResponse.json({
    message: '导出成功',
    format,
    dateRange,
    filters,
    caliberNote: includeCaliberNote
      ? '教室利用率口径说明：本报告所涉教室利用率数据来源于教务系统排课记录与一卡通门禁签到数据。利用率 = 实际使用课时 / 排课总课时 × 100%。其中实际使用课时以一卡通签到记录为准，签到时间与排课时间匹配度≥80%视为有效使用。统计周期为自然学期，不含补课与临时借用。'
      : undefined,
  })
}
