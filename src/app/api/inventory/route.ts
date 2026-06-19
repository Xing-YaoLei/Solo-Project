import { NextResponse } from 'next/server';
import { getInventoryData } from '@/lib/dataService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scopeStr = searchParams.get('scope');

    if (scopeStr) {
      const scope = decodeURIComponent(scopeStr).split(',');
      if (!scope.includes('inventory:view')) {
        return NextResponse.json([], { status: 200 });
      }
    }

    const data = await getInventoryData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API inventory] 错误:', error);
    return NextResponse.json(
      { error: '获取库存数据失败' },
      { status: 500 }
    );
  }
}
