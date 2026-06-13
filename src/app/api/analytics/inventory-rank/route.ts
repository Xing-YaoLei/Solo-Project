import { NextResponse } from 'next/server';
import { getInventoryRanking } from '@/services/metricsService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '10');

    const data = await getInventoryRanking(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      limit
    );

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: '获取库存排行数据失败' },
      { status: 500 }
    );
  }
}
