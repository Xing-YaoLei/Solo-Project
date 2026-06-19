import { NextResponse } from 'next/server';
import { getAuthContext, validateShareToken } from '@/lib/auth';
import type { ApiResponse, DataScope } from '@/types';
import { CLEANING_PUNCTUALITY_RULE } from '@/lib/utils';
import {
  getCheckinTrend,
  getDepositRecords,
  getComplaints,
  getReviewTags,
  getCleaningPunctuality,
  getDashboardSummary,
} from '@/lib/dbService';

export async function POST(request: Request) {
  const body = await request.json();
  const { type, format, shareToken, sharePassword } = body;

  let dataScope: DataScope;
  if (shareToken) {
    const validation = await validateShareToken(shareToken, sharePassword);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: { code: 'SHARE_INVALID', message: validation.error || '分享链接无效' } } as unknown as ApiResponse<null>, { status: 403 });
    }
    dataScope = validation.authContext!.dataScope;
  } else {
    const auth = await getAuthContext();
    dataScope = auth.dataScope;
  }

  const punctuality = await getCleaningPunctuality(dataScope);

  let exportData: any;
  let fileName = '';
  const today = new Date().toISOString().split('T')[0];

  switch (type) {
    case 'checkin': {
      const data = await getCheckinTrend(dataScope, 30);
      exportData = data.map(r => ({
        日期: r.date,
        门店: r.hotelName,
        证件类型: r.idType === 'id_card' ? '身份证' : r.idType === 'passport' ? '护照' : '其他',
        入住总数: r.totalCount,
        异常数量: r.anomalyCount,
        异常率: `${(r.anomalyRate * 100).toFixed(2)}%`,
        异常类型: (r.anomalyType || []).join('、'),
      }));
      fileName = `入住证件趋势_${today}`;
      break;
    }
    case 'deposit': {
      const { records } = await getDepositRecords(dataScope);
      exportData = records.map(r => ({
        订单号: r.orderId,
        客人姓名: r.guestName,
        门店: r.hotelName,
        押金金额: r.totalAmount,
        已退还: r.refundedAmount,
        已扣除: r.deductedAmount,
        状态: r.status === 'collected' ? '已收取' : r.status === 'refunded' ? '已退还' : r.status === 'deducted' ? '已扣除' : '待处理',
        扣除原因: r.deductionReason || '',
        创建时间: new Date(r.createdAt).toLocaleString('zh-CN'),
        更新时间: new Date(r.updatedAt).toLocaleString('zh-CN'),
      }));
      fileName = `押金明细_${today}`;
      break;
    }
    case 'complaint': {
      const records = await getComplaints(dataScope);
      exportData = records.flatMap(r => r.messages.map(m => ({
        客诉编号: r.id,
        订单号: r.orderId,
        客人姓名: r.guestName,
        门店: r.hotelName,
        客诉类型: r.complaintType,
        严重程度: r.severity === 'low' ? '低' : r.severity === 'medium' ? '中' : '高',
        客诉状态: r.status === 'open' ? '待处理' : r.status === 'processing' ? '处理中' : '已解决',
        创建时间: new Date(r.createdAt).toLocaleString('zh-CN'),
        解决时间: r.resolvedAt ? new Date(r.resolvedAt).toLocaleString('zh-CN') : '',
        消息发送方: m.sender === 'guest' ? '客人' : m.sender === 'staff' ? '客服' : '系统',
        消息内容: m.content,
        消息时间: new Date(m.timestamp).toLocaleString('zh-CN'),
      })));
      fileName = `客诉证据链_${today}`;
      break;
    }
    case 'review': {
      const tags = await getReviewTags(dataScope);
      exportData = tags.map(t => ({
        标签名称: t.tagName,
        出现次数: t.count,
        情感倾向: t.sentiment === 'positive' ? '正面' : t.sentiment === 'negative' ? '负面' : '中性',
        是否异常: t.isAnomaly ? '是' : '否',
        异常说明: t.anomalyReason || '',
        趋势: t.trend === 'up' ? '上升' : t.trend === 'down' ? '下降' : '稳定',
      }));
      fileName = `点评标签分析_${today}`;
      break;
    }
    case 'dashboard': {
      const summary = await getDashboardSummary(dataScope);
      const { records: deposits } = await getDepositRecords(dataScope);
      const complaints = await getComplaints(dataScope);
      const tags = await getReviewTags(dataScope);
      const checkin = await getCheckinTrend(dataScope, 30);
      exportData = {
        '保洁准时率口径': {
          指标: '保洁准时率',
          数值: `${(punctuality.punctualityRate * 100).toFixed(1)}%`,
          计算公式: CLEANING_PUNCTUALITY_RULE,
          统计范围: `${punctuality.timeRange.start.toLocaleString('zh-CN')} ~ ${punctuality.timeRange.end.toLocaleString('zh-CN')}`,
        },
        '核心指标汇总': summary.metrics,
        '入住证件趋势': checkin,
        '押金明细': deposits,
        '客诉证据': complaints,
        '点评标签': tags,
      };
      fileName = `监测仪表盘_${today}`;
      break;
    }
    default:
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_TYPE', message: '无效的导出类型' },
      } as ApiResponse<null>, { status: 400 });
  }

  const response: ApiResponse<{
    data: typeof exportData;
    fileName: string;
    format: string;
    punctualityRate: number;
    calculationRule: string;
  }> = {
    success: true,
    data: {
      data: exportData,
      fileName,
      format,
      punctualityRate: punctuality.punctualityRate,
      calculationRule: CLEANING_PUNCTUALITY_RULE,
    },
    metadata: {
      lastRefreshedAt: new Date().toISOString(),
      dataScope,
      punctualityRate: punctuality.punctualityRate,
      calculationRule: CLEANING_PUNCTUALITY_RULE,
    },
  };

  return NextResponse.json(response);
}
