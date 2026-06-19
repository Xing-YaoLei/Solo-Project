import { NextResponse } from 'next/server';
import { getWorkorderTrend, getShareScopeByToken } from '@/lib/dataService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get('days')) || 30;
    const shareToken = searchParams.get('shareToken');
    const signature = searchParams.get('sig') || searchParams.get('signature');

    const auth = await getShareScopeByToken(shareToken, signature);
    if (auth.fromShare) {
      if (!auth.valid || !auth.scope.includes('dashboard:view')) {
        return NextResponse.json([]);
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
