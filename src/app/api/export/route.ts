import { NextResponse } from 'next/server';
import { Parser } from 'json2csv';
import * as XLSX from 'xlsx';
import { REWORK_RATE_CALCULATION } from '@/types';
import {
  getMockWorkorderTrend,
  getMockInventoryData,
  getMockQuotes,
} from '@/lib/mockData';

export async function POST(req: Request) {
  const { format = 'xlsx', scope = 'all' } = await req.json();

  const trend = getMockWorkorderTrend();
  const inventory = getMockInventoryData();
  const quotes = getMockQuotes();

  if (format === 'csv') {
    const fields = ['date', 'total', 'completed', 'reworked', 'reworkRate'];
    const parser = new Parser({ fields });
    const csv = parser.parse(trend);
    const fullCsv = csv + '\n\n' + REWORK_RATE_CALCULATION;

    return new NextResponse(fullCsv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="risk-report-${Date.now()}.csv"`,
      },
    });
  }

  const wb = XLSX.utils.book_new();

  if (scope === 'all' || scope.includes('trend')) {
    const ws1 = XLSX.utils.json_to_sheet(trend);
    XLSX.utils.book_append_sheet(wb, ws1, '工单趋势');
  }

  if (scope === 'all' || scope.includes('inventory')) {
    const ws2 = XLSX.utils.json_to_sheet(inventory);
    XLSX.utils.book_append_sheet(wb, ws2, '配件库存');
  }

  if (scope === 'all' || scope.includes('quotes')) {
    const quotesFlat = quotes.flatMap((q) =>
      q.items.map((item) => ({
        报价单号: q.quoteNo,
        客户: q.customerName,
        车牌号: q.vehiclePlate,
        状态: q.status,
        项目: item.description,
        数量: item.quantity,
        单价: item.unitPrice,
        配件SKU: item.partSku || '-',
      })),
    );
    const ws3 = XLSX.utils.json_to_sheet(quotesFlat);
    XLSX.utils.book_append_sheet(wb, ws3, '报价单明细');
  }

  const calcSheet = XLSX.utils.aoa_to_sheet([['返修率计算口径说明'], ...REWORK_RATE_CALCULATION.split('\n').map((l: string) => [l])]);
  XLSX.utils.book_append_sheet(wb, calcSheet, '计算口径说明');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="risk-report-${Date.now()}.xlsx"`,
    },
  });
}
