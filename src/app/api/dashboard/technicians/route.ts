import { NextResponse } from 'next/server';
import { getTechnicianRanking } from '@/services/metricsService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') as 'revenue' | 'orders' | 'rating' | undefined;

    const rankings = await getTechnicianRanking(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      sortBy
    );

    return NextResponse.json(rankings);
  } catch (error) {
    return NextResponse.json(
      { error: '获取技师排行失败' },
      { status: 500 }
    );
  }
}
