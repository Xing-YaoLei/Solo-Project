import { NextResponse } from 'next/server';
import { getInventoryData, getShareScopeByToken } from '@/lib/dataService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('shareToken');
    const signature = searchParams.get('sig') || searchParams.get('signature');

    const auth = await getShareScopeByToken(shareToken, signature);
    if (auth.fromShare) {
      if (!auth.valid || !auth.scope.includes('inventory:view')) {
        return NextResponse.json([]);
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
