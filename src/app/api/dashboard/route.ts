import { NextResponse } from 'next/server';
import { getDashboardData, getShareScopeByToken } from '@/lib/dataService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('shareToken');
    const signature = searchParams.get('sig') || searchParams.get('signature');

    const auth = await getShareScopeByToken(shareToken, signature);
    if (auth.fromShare) {
      if (!auth.valid) {
        return NextResponse.json(
          { error: '分享链接无效或已过期' },
          { status: 403 }
        );
      }
      if (!auth.scope.includes('dashboard:view')) {
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
