import { NextResponse } from 'next/server';
import { getQuotes } from '@/lib/dataService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scopeStr = searchParams.get('scope');

    if (scopeStr) {
      const scope = decodeURIComponent(scopeStr).split(',');
      if (!scope.includes('quotes:view')) {
        return NextResponse.json([], { status: 200 });
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
