import { NextResponse } from 'next/server';
import { calculateFunnelData } from '@/services/metricsService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const funnelData = await calculateFunnelData(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json(funnelData);
  } catch (error) {
    return NextResponse.json(
      { error: '获取漏斗数据失败' },
      { status: 500 }
    );
  }
}
