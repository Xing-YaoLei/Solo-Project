import { NextResponse } from 'next/server';
import { getWorkorderTrend } from '@/lib/dataService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get('days')) || 30;
    const scopeStr = searchParams.get('scope');

    if (scopeStr) {
      const scope = decodeURIComponent(scopeStr).split(',');
      if (!scope.includes('dashboard:view')) {
        return NextResponse.json([], { status: 200 });
      }
    }

    const data = await getWorkorderTrend(days);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API workorders/trend] 错误:', error);
    return NextResponse.json(
      { error: '获取工单趋势数据失败' },
      { status: 500 }
    );
  }
}
