import { Router, Request, Response } from 'express';
import * as XLSX from 'xlsx';
import {
  mockMetrics,
  mockMeterReadings,
  mockInspectionItems,
  mockPaymentFlows,
  mockComplaintTags,
  mockPropertyRanking,
  maintenanceCaliber,
  filterByRole,
} from '../mock/data.js';

const router = Router();

router.get('/report', (req: Request, res: Response) => {
  const format = (req.query.format as 'excel' | 'pdf') || 'excel';
  const role = req.query.role as string;
  const area = req.query.area as string;

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);

  const metrics = { ...mockMetrics, updateTime: now.toISOString() };
  const meterReadings = filterByRole(mockMeterReadings, role, area);
  const inspectionItems = filterByRole(mockInspectionItems, role, area);
  const paymentFlows = filterByRole(mockPaymentFlows, role, area);
  const complaintTags = filterByRole(mockComplaintTags, role, area);
  const propertyRanking = filterByRole(mockPropertyRanking, role, area);

  if (format === 'excel') {
    const wb = XLSX.utils.book_new();

    const caliberData = maintenanceCaliber
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => ({ 内容: line.trim() }));
    const caliberWs = XLSX.utils.json_to_sheet(caliberData);
    XLSX.utils.book_append_sheet(wb, caliberWs, '维修时长口径说明');

    const metricsData = [
      { 指标: '退租率', 数值: `${metrics.moveOutRate}%`, 说明: '月度统计' },
      { 指标: '验房通过率', 数值: `${metrics.inspectionPassRate}%`, 说明: '月度统计' },
      { 指标: '平均维修时长', 数值: `${metrics.avgRepairDuration}天`, 说明: '详见口径说明' },
      { 指标: '投诉率', 数值: `${metrics.complaintRate}%`, 说明: '月度统计' },
      { 指标: '数据更新时间', 数值: new Date(metrics.updateTime).toLocaleString('zh-CN'), 说明: '' },
    ];
    const metricsWs = XLSX.utils.json_to_sheet(metricsData);
    XLSX.utils.book_append_sheet(wb, metricsWs, '核心指标');

    const meterData = meterReadings.map((item) => ({
      房源名称: item.propertyName,
      日期: item.date,
      水表读数: item.waterReading.toFixed(2),
      电表读数: item.electricityReading.toFixed(2),
      用水量: item.waterUsage.toFixed(2),
      用电量: item.electricityUsage.toFixed(2),
      是否异常: item.isAnomaly ? '是' : '否',
      数据更新时间: new Date(item.updateTime).toLocaleString('zh-CN'),
    }));
    const meterWs = XLSX.utils.json_to_sheet(meterData);
    XLSX.utils.book_append_sheet(wb, meterWs, '水电读数趋势');

    const inspectionData = inspectionItems.map((item) => ({
      类别: item.category,
      项目名称: item.itemName,
      数量: item.count,
      占比: `${item.percentage}%`,
      严重程度: item.severity === 'low' ? '低' : item.severity === 'medium' ? '中' : '高',
      数据更新时间: new Date(item.updateTime).toLocaleString('zh-CN'),
    }));
    const inspectionWs = XLSX.utils.json_to_sheet(inspectionData);
    XLSX.utils.book_append_sheet(wb, inspectionWs, '验房清单构成');

    const paymentData = paymentFlows.map((item) => ({
      流水号: item.flowNo,
      房源名称: item.propertyName,
      租客姓名: item.tenantName,
      金额: item.amount.toFixed(2),
      款项类型: item.paymentType,
      支付时间: new Date(item.paymentTime).toLocaleString('zh-CN'),
      支付来源: item.source,
      数据更新时间: new Date(item.updateTime).toLocaleString('zh-CN'),
    }));
    const paymentWs = XLSX.utils.json_to_sheet(paymentData);
    XLSX.utils.book_append_sheet(wb, paymentWs, '收款流水明细');

    const complaintData = complaintTags.map((item) => ({
      投诉标签: item.tagName,
      投诉数量: item.count,
      涉及金额: item.amount.toFixed(2),
      是否异常: item.isAbnormal ? '是' : '否',
      数据更新时间: new Date(item.updateTime).toLocaleString('zh-CN'),
    }));
    const complaintWs = XLSX.utils.json_to_sheet(complaintData);
    XLSX.utils.book_append_sheet(wb, complaintWs, '投诉标签统计');

    const rankingData = propertyRanking.map((item) => ({
      房源名称: item.propertyName,
      区域: item.area,
      维修次数: item.repairCount,
      维修率: `${item.repairRate}%`,
      投诉次数: item.complaintCount,
      投诉率: `${item.complaintRate}%`,
      数据更新时间: new Date(item.updateTime).toLocaleString('zh-CN'),
    }));
    const rankingWs = XLSX.utils.json_to_sheet(rankingData);
    XLSX.utils.book_append_sheet(wb, rankingWs, '房源排行');

    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=退租验房风险监测报告_${timestamp}.xlsx`
    );

    res.send(excelBuffer);
  } else {
    res.status(400).json({
      code: 400,
      message: 'PDF导出功能开发中，暂支持Excel格式',
    });
  }
});

export default router;
