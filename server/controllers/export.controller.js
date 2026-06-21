import XLSX from "xlsx";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import {
  InventoryTurnover,
  TransferMaterial,
  FinanceData,
  OperationLog,
  ExportRecord,
} from "../models/index.js";
import { createOperationLog } from "../utils/operationLog.js";
import { formatDate, formatDateTime } from "../utils/common.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPORT_DIR = path.join(process.cwd(), "exports");
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

const MOCK_USER_ID = "66751ab2c3d4e5f6a7b8c9d1";
const MOCK_USER_NAME = "系统管理员";

const buildFilterDisplay = (type, filterParams) => {
  const parts = [];
  switch (type) {
    case "inventory-turnover":
      if (filterParams.month) parts.push(`月份: ${filterParams.month}`);
      if (filterParams.status) parts.push(`状态: ${filterParams.status}`);
      break;
    case "transfer-materials":
      if (filterParams.overallStatus) parts.push(`状态: ${filterParams.overallStatus}`);
      break;
    case "finance-data":
      if (filterParams.settlementStatus) parts.push(`结算状态: ${filterParams.settlementStatus}`);
      break;
    case "operation-logs":
      if (filterParams.module) parts.push(`模块: ${filterParams.module}`);
      if (filterParams.status) parts.push(`状态: ${filterParams.status}`);
      if (filterParams.startDate) parts.push(`开始日期: ${filterParams.startDate}`);
      if (filterParams.endDate) parts.push(`结束日期: ${filterParams.endDate}`);
      break;
  }
  return parts.length > 0 ? parts.join(" | ") : "无筛选条件";
};

const generateXlsx = (type, data, filterParams, generatedBy) => {
  const wb = XLSX.utils.book_new();
  const timestamp = formatDateTime(new Date()).replace(/[: ]/g, "-");
  const fileName = `${type}-${timestamp}.xlsx`;
  const filePath = path.join(EXPORT_DIR, fileName);

  let wsData = [];
  const headers = [];

  headers.push("导出信息");
  wsData.push(["导出类型", getExportTypeName(type)]);
  wsData.push(["筛选范围", buildFilterDisplay(type, filterParams)]);
  wsData.push(["生成时间", formatDateTime(new Date())]);
  wsData.push(["操作人", generatedBy || MOCK_USER_NAME]);
  wsData.push([]);

  switch (type) {
    case "inventory-turnover": {
      headers.push("库存周转数据");
      wsData.push([
        "车辆品牌",
        "车型",
        "年款",
        "VIN码",
        "入库日期",
        "售出日期",
        "过户日期",
        "库龄(天)",
        "售出耗时(天)",
        "过户耗时(天)",
        "采购价",
        "整备成本",
        "总成本",
        "售价",
        "利润",
        "利润率(%)",
        "状态",
      ]);
      for (const item of data) {
        wsData.push([
          item.brand,
          item.model,
          item.year,
          item.vin,
          formatDate(item.inStockDate),
          formatDate(item.soldDate),
          formatDate(item.transferredDate),
          item.daysInStock,
          item.daysToSell,
          item.daysToTransfer,
          item.purchasePrice,
          item.preparationCost,
          item.totalCost,
          item.sellingPrice,
          item.profit,
          item.profitMargin?.toFixed(2),
          getStatusName(item.status),
        ]);
      }
      break;
    }
    case "transfer-materials": {
      headers.push("过户材料数据");
      wsData.push([
        "车辆品牌",
        "车型",
        "车牌号",
        "材料名称",
        "分类",
        "是否必需",
        "状态",
        "提交时间",
        "审核时间",
        "备注",
      ]);
      for (const record of data) {
        for (const material of record.materials || []) {
          wsData.push([
            record.carId?.brand,
            record.carId?.model,
            record.carId?.plateNumber,
            material.name,
            getCategoryName(material.category),
            material.required ? "是" : "否",
            getMaterialStatusName(material.status),
            formatDateTime(material.submittedDate),
            formatDateTime(material.verifiedDate),
            material.remark,
          ]);
        }
      }
      break;
    }
    case "finance-data": {
      headers.push("金融资料数据");
      wsData.push([
        "车辆品牌",
        "车型",
        "车牌号",
        "采购价",
        "整备成本",
        "总成本",
        "售价",
        "实收金额",
        "利润",
        "利润率(%)",
        "结算状态",
        "买家",
        "成交日期",
      ]);
      for (const item of data) {
        wsData.push([
          item.carId?.brand,
          item.carId?.model,
          item.carId?.plateNumber,
          item.purchasePrice,
          item.preparationCost,
          item.totalCost,
          item.sellingPrice,
          item.actualReceived,
          item.profit,
          item.profitMargin?.toFixed(2),
          getSettlementStatusName(item.settlementStatus),
          item.buyerName,
          formatDate(item.dealDate),
        ]);
      }
      break;
    }
    case "operation-logs": {
      headers.push("操作日志数据");
      wsData.push([
        "操作时间",
        "模块",
        "动作",
        "操作对象",
        "原因",
        "操作人",
        "角色",
        "状态",
        "关闭时间",
        "关闭备注",
      ]);
      for (const log of data) {
        wsData.push([
          formatDateTime(log.createdAt),
          getModuleName(log.module),
          log.action,
          log.targetName,
          log.reason,
          log.operatorId?.name || log.operatorName,
          log.operatorId?.role || log.operatorRole,
          log.status === "open" ? "进行中" : log.status === "closed" ? "已关闭" : "失败",
          formatDateTime(log.closedAt),
          log.closeRemark,
        ]);
      }
      break;
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "导出数据");

  const summaryWs = XLSX.utils.aoa_to_sheet([
    ["导出摘要"],
    ["导出类型", getExportTypeName(type)],
    ["筛选范围", buildFilterDisplay(type, filterParams)],
    ["生成时间", formatDateTime(new Date())],
    ["操作人", generatedBy || MOCK_USER_NAME],
    ["数据条数", data.length],
  ]);
  XLSX.utils.book_append_sheet(wb, summaryWs, "导出摘要");

  XLSX.writeFile(wb, filePath);

  return { fileName, filePath };
};

const getExportTypeName = (type) => {
  const map = {
    "inventory-turnover": "库存周转",
    "transfer-materials": "过户材料",
    "finance-data": "金融资料",
    "operation-logs": "操作日志",
  };
  return map[type] || type;
};

const getStatusName = (status) => {
  const map = {
    "in-stock": "在库",
    sold: "已售出",
    transferred: "已过户",
  };
  return map[status] || status;
};

const getCategoryName = (category) => {
  const map = {
    "vehicle-docs": "车辆证件",
    "owner-docs": "原车主证件",
    "buyer-docs": "新车主证件",
    "transaction-docs": "交易文件",
    "insurance-docs": "保险资料",
    other: "其他",
  };
  return map[category] || category;
};

const getMaterialStatusName = (status) => {
  const map = {
    missing: "缺失",
    submitted: "已提交",
    verified: "已审核",
    rejected: "已驳回",
    waived: "已豁免",
  };
  return map[status] || status;
};

const getSettlementStatusName = (status) => {
  const map = {
    pending: "待处理",
    "in-progress": "处理中",
    completed: "已完成",
    "on-hold": "搁置",
  };
  return map[status] || status;
};

const getModuleName = (module) => {
  const map = {
    "transfer-material": "过户材料",
    "finance-data": "金融资料",
    preparation: "整备清单",
    "test-drive": "试驾记录",
    quote: "报价记录",
    car: "车辆管理",
    notification: "消息通知",
    export: "数据导出",
    system: "系统",
    other: "其他",
  };
  return map[module] || module;
};

const createExportRecord = async (
  exportType,
  fileName,
  filePath,
  filterParams,
  recordCount
) => {
  const stats = fs.statSync(filePath);
  const exportRecord = new ExportRecord({
    exportType,
    fileName,
    fileUrl: `/api/export/download/${fileName}`,
    fileFormat: "xlsx",
    filterParams,
    filterDisplay: buildFilterDisplay(exportType, filterParams),
    generatedBy: MOCK_USER_ID,
    generatedByName: MOCK_USER_NAME,
    recordCount,
    fileSize: stats.size,
    status: "completed",
  });
  await exportRecord.save();
  return exportRecord;
};

export const listExportRecords = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, exportType } = req.query;
    const query = {};
    if (exportType) query.exportType = exportType;

    const skip = (page - 1) * pageSize;

    const [list, total] = await Promise.all([
      ExportRecord.find(query)
        .sort({ generatedAt: -1 })
        .skip(skip)
        .limit(Number(pageSize)),
      ExportRecord.countDocuments(query),
    ]);

    res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const downloadExport = async (req, res) => {
  try {
    const fileName = req.params.id;
    const filePath = path.join(EXPORT_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "文件不存在" });
    }

    res.download(filePath, fileName);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const exportInventoryTurnover = async (req, res) => {
  try {
    const filterParams = req.body;
    const query = {};
    if (filterParams.month) query.month = filterParams.month;
    if (filterParams.quarter) query.quarter = filterParams.quarter;
    if (filterParams.year) query.year = Number(filterParams.year);
    if (filterParams.status) query.status = filterParams.status;

    const data = await InventoryTurnover.find(query).sort({ inStockDate: -1 });
    const { fileName, filePath } = generateXlsx(
      "inventory-turnover",
      data,
      filterParams,
      MOCK_USER_NAME
    );

    const exportRecord = await createExportRecord(
      "inventory-turnover",
      fileName,
      filePath,
      filterParams,
      data.length
    );

    await createOperationLog({
      action: "export",
      module: "export",
      targetType: "ExportRecord",
      targetId: exportRecord._id,
      targetName: "库存周转数据导出",
      reason: `筛选条件: ${buildFilterDisplay("inventory-turnover", filterParams)}`,
      newValue: { fileName, recordCount: data.length },
      operatorId: MOCK_USER_ID,
      operatorName: MOCK_USER_NAME,
    });

    res.json(exportRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const exportTransferMaterials = async (req, res) => {
  try {
    const filterParams = req.body;
    const query = {};
    if (filterParams.overallStatus) query.overallStatus = filterParams.overallStatus;

    const data = await TransferMaterial.find(query)
      .sort({ updatedAt: -1 })
      .populate("carId", "brand model plateNumber vin");

    const { fileName, filePath } = generateXlsx(
      "transfer-materials",
      data,
      filterParams,
      MOCK_USER_NAME
    );

    const exportRecord = await createExportRecord(
      "transfer-materials",
      fileName,
      filePath,
      filterParams,
      data.length
    );

    await createOperationLog({
      action: "export",
      module: "export",
      targetType: "ExportRecord",
      targetId: exportRecord._id,
      targetName: "过户材料数据导出",
      reason: `筛选条件: ${buildFilterDisplay("transfer-materials", filterParams)}`,
      newValue: { fileName, recordCount: data.length },
      operatorId: MOCK_USER_ID,
      operatorName: MOCK_USER_NAME,
    });

    res.json(exportRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const exportFinanceData = async (req, res) => {
  try {
    const filterParams = req.body;
    const query = {};
    if (filterParams.settlementStatus) query.settlementStatus = filterParams.settlementStatus;

    const data = await FinanceData.find(query)
      .sort({ updatedAt: -1 })
      .populate("carId", "brand model plateNumber vin");

    const { fileName, filePath } = generateXlsx(
      "finance-data",
      data,
      filterParams,
      MOCK_USER_NAME
    );

    const exportRecord = await createExportRecord(
      "finance-data",
      fileName,
      filePath,
      filterParams,
      data.length
    );

    await createOperationLog({
      action: "export",
      module: "export",
      targetType: "ExportRecord",
      targetId: exportRecord._id,
      targetName: "金融资料数据导出",
      reason: `筛选条件: ${buildFilterDisplay("finance-data", filterParams)}`,
      newValue: { fileName, recordCount: data.length },
      operatorId: MOCK_USER_ID,
      operatorName: MOCK_USER_NAME,
    });

    res.json(exportRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const exportOperationLogs = async (req, res) => {
  try {
    const filterParams = req.body;
    const query = {};
    if (filterParams.module) query.module = filterParams.module;
    if (filterParams.status) query.status = filterParams.status;
    if (filterParams.startDate)
      query.createdAt = { ...query.createdAt, $gte: new Date(filterParams.startDate) };
    if (filterParams.endDate)
      query.createdAt = { ...query.createdAt, $lte: new Date(filterParams.endDate) };

    const data = await OperationLog.find(query)
      .sort({ createdAt: -1 })
      .populate("operatorId", "name role");

    const { fileName, filePath } = generateXlsx(
      "operation-logs",
      data,
      filterParams,
      MOCK_USER_NAME
    );

    const exportRecord = await createExportRecord(
      "operation-logs",
      fileName,
      filePath,
      filterParams,
      data.length
    );

    await createOperationLog({
      action: "export",
      module: "export",
      targetType: "ExportRecord",
      targetId: exportRecord._id,
      targetName: "操作日志数据导出",
      reason: `筛选条件: ${buildFilterDisplay("operation-logs", filterParams)}`,
      newValue: { fileName, recordCount: data.length },
      operatorId: MOCK_USER_ID,
      operatorName: MOCK_USER_NAME,
    });

    res.json(exportRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
