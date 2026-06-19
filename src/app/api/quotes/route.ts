import { NextResponse } from 'next/server';
import { getQuotes, getShareScopeByToken } from '@/lib/dataService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('shareToken');
    const signature = searchParams.get('sig') || searchParams.get('signature');

    const auth = await getShareScopeByToken(shareToken, signature);
    if (auth.fromShare) {
      if (!auth.valid || !auth.scope.includes('quotes:view')) {
        return NextResponse.json([]);
      }
    }

    const data = await getQuotes();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API quotes] 错误:', error);
    return NextResponse.json(
      { error: '获取报价单数据失败' },
      { status: 500 }
    );
  }
}
