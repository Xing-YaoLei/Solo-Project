import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import {
  getOverviewDataFromDB,
  getQuotationTrendFromDB,
  getInspectionDataFromDB,
  getVehicleRecordsFromDB,
  getDiagnosisDataFromDB,
  getInsuranceDataFromDB,
  validateShareTokenInDB,
} from "@/lib/dbService";
import { getRolePermissions } from "@/types";

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
    let role = (searchParams.get("role") as string) || "director";
    const token = searchParams.get("token");

    let scope: string[] = [];
    if (token) {
      const tokenValidation = await validateShareTokenInDB(token);
      if (!tokenValidation.valid) {
        return NextResponse.json(
          { error: tokenValidation.error || "分享链接无效" },
          { status: 403 }
        );
      }
      role = tokenValidation.role || role;
      scope = tokenValidation.scope || [];
    }

    const permissions = getRolePermissions(role as any);

    if (!permissions.canExport) {
      return NextResponse.json(
        { error: "无导出权限" },
        { status: 403 }
      );
    }

    const canAccess = (module: string) => scope.length === 0 || scope.includes(module);
    const canViewFull = permissions.canExportFull;

    const dataPromises: Promise<any>[] = [];
    const dataTypes: string[] = [];

    if (permissions.canViewOverview && canAccess("overview")) {
      dataPromises.push(getOverviewDataFromDB());
      dataTypes.push("overview");
    }
    if (permissions.canViewQuotation && canAccess("quotation")) {
      dataPromises.push(getQuotationTrendFromDB("day"));
      dataTypes.push("quotation");
    }
    if (permissions.canViewInspection && canAccess("inspection")) {
      dataPromises.push(getInspectionDataFromDB());
      dataTypes.push("inspection");
    }
    if (permissions.canViewVehicles && canAccess("vehicles")) {
      dataPromises.push(getVehicleRecordsFromDB(1, 50));
      dataTypes.push("vehicles");
    }
    if (permissions.canViewInsurance && canAccess("insurance")) {
      dataPromises.push(getInsuranceDataFromDB());
      dataTypes.push("insurance");
    }
    if (permissions.canViewDiagnosis && canAccess("diagnosis")) {
      dataPromises.push(getDiagnosisDataFromDB());
      dataTypes.push("diagnosis");
    }

    const results = await Promise.all(dataPromises);
    const data: Record<string, any> = {};
    results.forEach((result, index) => {
      data[dataTypes[index]] = result;
    });

    const wb = XLSX.utils.book_new();

    if (data.overview) {
      const overviewData = [
        ["指标", "数值"],
        ["工单总量", data.overview.totalWorkOrders],
        ["平均维修时长(小时)", data.overview.avgRepairDuration],
        ["返修率", `${(data.overview.reworkRate * 100).toFixed(2)}%`],
        ["工位利用率", `${(data.overview.stationUtilization * 100).toFixed(2)}%`],
        ["数据更新时间", new Date(data.overview.lastUpdated).toLocaleString("zh-CN")],
      ];
      const ws = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, ws, "总览指标");
    }

    if (data.quotation) {
      const quotationData = [
        ["日期", "工单数量", canViewFull ? "总金额(元)" : "总金额(脱敏)", canViewFull ? "平均金额(元)" : "平均金额(脱敏)"],
        ...data.quotation.data.map((item: any) => [
          item.date,
          item.orderCount,
          canViewFull ? item.totalAmount.toFixed(2) : "***",
          canViewFull ? item.avgAmount.toFixed(2) : "***",
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(quotationData);
      XLSX.utils.book_append_sheet(wb, ws, "报价单趋势");
    }

    if (data.inspection) {
      const inspectionData = [
        ["项目", "数量", "占比"],
        ["总质检数", data.inspection.summary.total, "100%"],
        ["通过数", data.inspection.summary.passed, `${(data.inspection.summary.passRate * 100).toFixed(2)}%`],
        ["未通过数", data.inspection.summary.failed, `${((1 - data.inspection.summary.passRate) * 100).toFixed(2)}%`],
        [],
        ["问题类型", "数量", "占比"],
        ...data.inspection.issues.map((issue: any) => [
          issue.type,
          issue.count,
          `${(issue.percentage * 100).toFixed(2)}%`,
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(inspectionData);
      XLSX.utils.book_append_sheet(wb, ws, "质检照片构成");
    }

    if (data.vehicles) {
      const vehicleHeaders = ["车牌号", "车型", "车主", "上次维修日期", "维修次数", "累计金额(元)"];
      if (canViewFull && permissions.canViewInsurance) {
        vehicleHeaders.push("保险理赔笔数");
      }
      const vehicleData = [
        vehicleHeaders,
        ...data.vehicles.data.map((v: any) => {
          const row = [
            canViewFull ? v.plateNumber : v.plateNumber.substring(0, 3) + "****",
            v.vehicleModel,
            canViewFull ? v.ownerName : v.ownerName.substring(0, 1) + "*",
            v.lastServiceDate,
            v.serviceCount,
            canViewFull ? v.totalAmount.toFixed(2) : "***",
          ];
          if (canViewFull && permissions.canViewInsurance) {
            row.push(v.insuranceDocs?.length || 0);
          }
          return row;
        }),
      ];
      const ws = XLSX.utils.aoa_to_sheet(vehicleData);
      XLSX.utils.book_append_sheet(wb, ws, "车辆档案");

      if (permissions.canViewParts && data.vehicles.data.some((v: any) => v.parts && v.parts.length > 0)) {
        const partData = [
          ["车牌号", "配件名称", "配件编码", "数量", "单价(元)", "小计(元)", "使用日期"],
          ...data.vehicles.data.flatMap((v: any) =>
            (v.parts || []).map((p: any) => [
              canViewFull ? v.plateNumber : v.plateNumber.substring(0, 3) + "****",
              p.partName,
              canViewFull ? p.partCode : "***",
              p.quantity,
              canViewFull ? p.unitPrice.toFixed(2) : "***",
              canViewFull ? p.subtotal.toFixed(2) : "***",
              p.usedDate,
            ])
          ),
        ];
        const wsParts = XLSX.utils.aoa_to_sheet(partData);
        XLSX.utils.book_append_sheet(wb, wsParts, "配件使用明细");
      }
    }

    if (data.insurance && permissions.canViewInsurance) {
      const insuranceSummary = [
        ["指标", "数值"],
        ["理赔总笔数", data.insurance.summary.totalClaims],
        ["理赔总金额(元)", data.insurance.summary.totalClaimAmount.toFixed(2)],
        ["待处理", data.insurance.summary.pendingCount],
        ["已批准", data.insurance.summary.approvedCount],
        ["已结算", data.insurance.summary.settledCount],
        ["平均理赔金额(元)", data.insurance.summary.avgClaimAmount.toFixed(2)],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(insuranceSummary);
      XLSX.utils.book_append_sheet(wb, wsSummary, "保险理赔汇总");

      const insuranceDetail = [
        ["车牌号", "车型", "保险公司", "保单号", "理赔金额(元)", "状态", "申请日期", "结算日期"],
        ...data.insurance.claims.map((claim: any) => [
          canViewFull ? claim.plateNumber : claim.plateNumber.substring(0, 3) + "****",
          claim.vehicleModel,
          claim.company,
          canViewFull ? claim.policyNumber : claim.policyNumber.substring(0, 6) + "****",
          canViewFull ? claim.claimAmount.toFixed(2) : "***",
          claim.claimStatus === "settled" ? "已结算" : claim.claimStatus === "approved" ? "已批准" : "待处理",
          claim.filedDate,
          claim.settledDate || "-",
        ]),
      ];
      const wsDetail = XLSX.utils.aoa_to_sheet(insuranceDetail);
      XLSX.utils.book_append_sheet(wb, wsDetail, "保险理赔明细");
    }

    if (data.diagnosis) {
      const diagnosisData = [
        ["日期", "车牌号", "诊断项目", "严重程度", "是否返修", "负责技师"],
        ...data.diagnosis.abnormalItems.map((item: any) => [
          item.date,
          canViewFull ? item.vehiclePlate : item.vehiclePlate.substring(0, 3) + "****",
          item.diagnosisItem,
          item.severity === "high" ? "高" : item.severity === "medium" ? "中" : "低",
          item.isRework ? "是" : "否",
          canViewFull ? item.technician : item.technician.substring(0, 1) + "*",
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(diagnosisData);
      XLSX.utils.book_append_sheet(wb, ws, "诊断异常");
    }

    const noteData = reworkRateNote.split("\n").map((line) => [line]);
    const wsNote = XLSX.utils.aoa_to_sheet(noteData);
    XLSX.utils.book_append_sheet(wb, wsNote, "返修率口径说明");

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
