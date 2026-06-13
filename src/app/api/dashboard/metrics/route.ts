import { NextResponse } from 'next/server';
import { calculateDashboardMetrics } from '@/services/metricsService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const metrics = await calculateDashboardMetrics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json(
      { error: '获取指标数据失败' },
      { status: 500 }
    );
  }
}
