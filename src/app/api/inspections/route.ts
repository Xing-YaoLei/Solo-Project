import { NextResponse } from 'next/server';
import { getInspections } from '@/lib/dataService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scopeStr = searchParams.get('scope');

    if (scopeStr) {
      const scope = decodeURIComponent(scopeStr).split(',');
      if (!scope.includes('inspection:view')) {
        return NextResponse.json([], { status: 200 });
      }
    }

    const data = await getInspections();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API inspections] 错误:', error);
    return NextResponse.json(
      { error: '获取质检数据失败' },
      { status: 500 }
    );
  }
}
