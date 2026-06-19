import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import {
  getOverviewData,
  getQuotationTrend,
  getInspectionData,
  getVehicleRecords,
  getDiagnosisData,
} from "@/lib/mockData";

const reworkRateNote = `返修率口径说明：
1. 定义：返修率 = 返修工单数 / 总工单数量 × 100%
2. 统计范围：统计周期内完成的所有维修工单
3. 返修判定：同一车辆 30 天内因相同故障再次入场维修
4. 时间维度：支持按日、周、月统计
5. 排除项：保养类工单、主动召回不计入返修率统计
`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "director";

    if (role === "external" || role === "technician") {
      return NextResponse.json(
        { error: "无导出权限" },
        { status: 403 }
      );
    }

    const [overview, quotation, inspection, vehicles, diagnosis] = await Promise.all([
      getOverviewData(),
      getQuotationTrend("day"),
      getInspectionData(),
      getVehicleRecords(1, 50),
      getDiagnosisData(),
    ]);

    const wb = XLSX.utils.book_new();

    const overviewData = [
      ["指标", "数值"],
      ["工单总量", overview.totalWorkOrders],
      ["平均维修时长(小时)", overview.avgRepairDuration],
      ["返修率", `${(overview.reworkRate * 100).toFixed(2)}%`],
      ["工位利用率", `${(overview.stationUtilization * 100).toFixed(2)}%`],
      ["数据更新时间", new Date(overview.lastUpdated).toLocaleString("zh-CN")],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, ws1, "总览指标");

    const quotationData = [
      ["日期", "工单数量", "总金额(元)", "平均金额(元)"],
      ...quotation.data.map((item) => [
        item.date,
        item.orderCount,
        item.totalAmount.toFixed(2),
        item.avgAmount.toFixed(2),
      ]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(quotationData);
    XLSX.utils.book_append_sheet(wb, ws2, "报价单趋势");

    const inspectionData = [
      ["项目", "数量", "占比"],
      ["总质检数", inspection.summary.total, "100%"],
      ["通过数", inspection.summary.passed, `${(inspection.summary.passRate * 100).toFixed(2)}%`],
      ["未通过数", inspection.summary.failed, `${((1 - inspection.summary.passRate) * 100).toFixed(2)}%`],
      [],
      ["问题类型", "数量", "占比"],
      ...inspection.issues.map((issue) => [
        issue.type,
        issue.count,
        `${(issue.percentage * 100).toFixed(2)}%`,
      ]),
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(inspectionData);
    XLSX.utils.book_append_sheet(wb, ws3, "质检照片构成");

    const vehicleData = [
      ["车牌号", "车型", "车主", "上次维修日期", "维修次数", "累计金额(元)"],
      ...vehicles.data.map((v) => [
        v.plateNumber,
        v.vehicleModel,
        v.ownerName,
        v.lastServiceDate,
        v.serviceCount,
        v.totalAmount.toFixed(2),
      ]),
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(vehicleData);
    XLSX.utils.book_append_sheet(wb, ws4, "车辆档案");

    const diagnosisData = [
      ["日期", "车牌号", "诊断项目", "严重程度", "是否返修", "负责技师"],
      ...diagnosis.abnormalItems.map((item) => [
        item.date,
        item.vehiclePlate,
        item.diagnosisItem,
        item.severity === "high" ? "高" : item.severity === "medium" ? "中" : "低",
        item.isRework ? "是" : "否",
        item.technician,
      ]),
    ];
    const ws5 = XLSX.utils.aoa_to_sheet(diagnosisData);
    XLSX.utils.book_append_sheet(wb, ws5, "诊断异常");

    const noteData = reworkRateNote.split("\n").map((line) => [line]);
    const ws6 = XLSX.utils.aoa_to_sheet(noteData);
    XLSX.utils.book_append_sheet(wb, ws6, "返修率口径说明");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    const fileName = `汽车维修报表_${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Export API error:", error);
    return NextResponse.json(
      { error: "导出失败" },
      { status: 500 }
    );
  }
}
