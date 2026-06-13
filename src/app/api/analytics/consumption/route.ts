import { NextResponse } from 'next/server';
import { getConsumptionDistribution } from '@/services/metricsService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dimension = searchParams.get('dimension') as 'item' | 'amount' | 'time' || 'item';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const data = await getConsumptionDistribution(
      dimension,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: '获取消费分布数据失败' },
      { status: 500 }
    );
  }
}
