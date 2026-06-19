import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/dataService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scopeStr = searchParams.get('scope');

    if (scopeStr) {
      const scope = decodeURIComponent(scopeStr).split(',');
      if (!scope.includes('dashboard:view')) {
        return NextResponse.json(
          { error: '无权限访问仪表盘数据' },
          { status: 403 }
        );
      }
    }

    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API dashboard] 错误:', error);
    return NextResponse.json(
      { error: '获取仪表盘数据失败' },
      { status: 500 }
    );
  }
}
