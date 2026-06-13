import { NextResponse } from 'next/server';
import { getFollowupScriptTrend } from '@/services/metricsService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const data = await getFollowupScriptTrend(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: '获取回访话术趋势失败' },
      { status: 500 }
    );
  }
}
