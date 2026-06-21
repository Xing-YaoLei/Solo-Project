import { NextResponse } from 'next/server';
import { getLockRecords } from '@/services/dashboardService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activityIdsParam = searchParams.get('activityIds');
    const activityIds = activityIdsParam ? activityIdsParam.split(',') : undefined;
    const anomalyOnly = searchParams.get('anomalyOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const result = await getLockRecords({
      activityIds,
      anomalyOnly,
      page,
      pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        records: result.records,
        total: result.total,
        page,
        pageSize,
        anomalyCount: result.anomalyCount,
        activityIds,
        lastRefreshedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to fetch lock records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lock records' },
      { status: 500 }
    );
  }
}
