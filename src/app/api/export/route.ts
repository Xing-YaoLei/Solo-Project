import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { buildExportData } from "@/lib/dataService";
import { CALIBER_VERSION, CALIBER_DEFINITION } from "@/lib/constants";

export async function POST(request: Request) {
  const body = await request.json();
  const params = {
    siteId: body.siteId,
    materialCategory: body.materialCategory,
    dateFrom: body.dateFrom,
    dateTo: body.dateTo,
    caliberVersion: body.caliberVersion || CALIBER_VERSION,
  };

  const exportData = await buildExportData(params);
  const wb = XLSX.utils.book_new();

  const metaSheet = [
    ["家装工地材料进场漏斗报表 - 周转天数分析"],
    [`导出时间,${exportData.meta.exportTime}`],
    [`口径版本,${exportData.meta.caliberVersion}`],
    [],
    ["过滤条件"],
    ...Object.entries(exportData.meta.filters).map(([k, v]) => [k, v as string]),
    [],
    ["口径定义"],
    ...Object.entries(CALIBER_DEFINITION.definitions).map(([k, v]) => [k, v as string]),
    [],
    ["漏斗阶段汇总"],
  ];
  XLSX.utils.sheet_add_aoa(metaSheet, [["阶段", "数量", "批次数", "短缺数量", "短缺批次", "平均周转天数", "转化率"]], { origin: -1 });
  exportData.meta.funnelSummary.forEach((row) => {
    XLSX.utils.sheet_add_aoa(metaSheet, [[row.阶段, row.数量, row.批次, row.短缺数量, row.短缺批次数, row.平均周转天数, row.转化率]], { origin: -1 });
  });
  const ws1 = XLSX.utils.aoa_to_sheet(metaSheet);
  XLSX.utils.book_append_sheet(wb, ws1, "概览与口径");

  const ws2 = XLSX.utils.json_to_sheet(exportData.arrivals);
  XLSX.utils.book_append_sheet(wb, ws2, "周转天数明细");

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
  const fileName = `材料漏斗报表_${params.caliberVersion}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
