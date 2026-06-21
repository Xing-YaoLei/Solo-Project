import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { generateMockOverview, generateMockSeatTrend, generateMockOrderComposition, generateMockTicketTypes, generateMockLockRecords } from '@/lib/mockData';
import { getOccupancyRateSpec, formatCurrency, formatPercent, formatDate } from '@/lib/utils';
import type { ExportOptions } from '@/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExportOptions;
    const { format, includeOccupancySpec, sections } = body;

    const overview = generateMockOverview();
    const seatTrend = generateMockSeatTrend();
    const orderComp = generateMockOrderComposition();
    const ticketTypes = generateMockTicketTypes();
    const lockRecords = generateMockLockRecords();

    const wb = XLSX.utils.book_new();

    if (sections.includes('overview') || sections.length === 0) {
      const overviewData = [
        ['活动票务座位分配看板 - 概览数据'],
        ['导出时间', formatDate(new Date())],
        [],
        ['核心指标'],
        ['总座位数', overview.totalSeats],
        ['已售座位数', overview.soldSeats],
        ['上座率', formatPercent(overview.occupancyRate)],
        ['锁座数量', overview.lockedSeats],
        ['异常数量', overview.anomalyCount],
        ['数据更新时间', formatDate(overview.lastRefreshedAt)],
      ];

      if (includeOccupancySpec) {
        const spec = getOccupancyRateSpec();
        overviewData.push(
          [],
          ['上座率计算口径说明'],
          ['计算方法', spec.calculationMethod],
          ['计算公式', spec.formula],
          ['排除座位', spec.excludedSeats.join('; ')],
          ['数据来源', spec.dataSources.join(', ')],
          ['口径更新时间', formatDate(spec.updateTime)]
        );
      }

      const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, wsOverview, '概览数据');
    }

    if (sections.includes('seatTrend') || sections.length === 0) {
      const trendData = [
        ['日期', '当日售出', '当日锁座', '可售座位', '预留座位', '累计售出'],
        ...seatTrend.map(d => [
          d.date,
          d.sold,
          d.locked,
          d.available,
          d.reserved,
          d.cumulativeSold,
        ]),
      ];
      const wsTrend = XLSX.utils.aoa_to_sheet(trendData);
      XLSX.utils.book_append_sheet(wb, wsTrend, '座位销售趋势');
    }

    if (sections.includes('orders') || sections.length === 0) {
      const orderData = [
        ['订单构成分析'],
        ['总订单数', orderComp.totalOrders],
        ['总金额', formatCurrency(orderComp.totalAmount)],
        [],
        ['按来源分布'],
        ['来源', '数量', '占比'],
        ...orderComp.bySource.map(s => [
          s.label,
          s.value,
          formatPercent(s.value / orderComp.totalOrders),
        ]),
        [],
        ['按支付方式分布'],
        ['支付方式', '数量', '占比'],
        ...orderComp.byPaymentMethod.map(p => [
          p.label,
          p.value,
          formatPercent(p.value / orderComp.totalOrders),
        ]),
        [],
        ['按票种分布'],
        ['票种', '数量', '占比'],
        ...orderComp.byTicketType.map(t => [
          t.label,
          t.value,
          formatPercent(t.value / orderComp.totalOrders),
        ]),
      ];
      const wsOrders = XLSX.utils.aoa_to_sheet(orderData);
      XLSX.utils.book_append_sheet(wb, wsOrders, '订单构成');
    }

    if (sections.includes('ticketTypes') || sections.length === 0) {
      const ticketData = [
        ['票种名称', '售价', '原价', '折扣', '总库存', '已售', '锁座', '剩余', '上座率', '限购', '销售开始', '销售结束', '限制规则'],
        ...ticketTypes.map(t => [
          t.name,
          t.price,
          t.originalPrice,
          formatPercent(t.discount),
          t.totalStock,
          t.soldCount,
          t.lockedCount,
          t.remainingCount,
          formatPercent(t.occupancyRate),
          `每人限购${t.maxPerOrder}张`,
          formatDate(t.saleStartTime),
          formatDate(t.saleEndTime),
          t.restrictions.join('; '),
        ]),
      ];
      const wsTickets = XLSX.utils.aoa_to_sheet(ticketData);
      XLSX.utils.book_append_sheet(wb, wsTickets, '票种明细');
    }

    if (sections.includes('lockRecords') || sections.length === 0) {
      const lockData = [
        ['座位信息', '操作人', '锁座原因', '锁座时长', '锁座时间', '过期时间', '状态', '是否异常', '异常类型', '异常说明'],
        ...lockRecords.map(r => [
          r.seatInfo,
          r.operatorName,
          r.lockReason,
          `${r.lockDuration}分钟`,
          formatDate(r.lockedAt),
          formatDate(r.expiredAt),
          r.status === 'active' ? '有效' : r.status === 'expired' ? '已过期' : '已释放',
          r.isAnomaly ? '是' : '否',
          r.anomalyType || '-',
          r.anomalyDescription || '-',
        ]),
      ];
      const wsLocks = XLSX.utils.aoa_to_sheet(lockData);
      XLSX.utils.book_append_sheet(wb, wsLocks, '锁座记录');
    }

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    const filename = `票务座位分配看板_${formatDate(new Date()).replace(/[/:]/g, '-')}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Failed to export dashboard data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export dashboard data' },
      { status: 500 }
    );
  }
}
