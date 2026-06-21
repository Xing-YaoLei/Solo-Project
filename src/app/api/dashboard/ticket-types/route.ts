import { NextResponse } from 'next/server';
import { getDashboardSnapshot } from '@/services/dashboardService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activityIdsParam = searchParams.get('activityIds');
    const activityIds = activityIdsParam ? activityIdsParam.split(',') : undefined;

    const snapshot = await getDashboardSnapshot(activityIds);

    return NextResponse.json({
      success: true,
      data: {
        ticketTypes: snapshot.ticketTypes,
        activityIds,
        lastRefreshedAt: snapshot.lastRefreshedAt,
        occupancyRateSpec: snapshot.occupancyRateSpec,
      },
    });
  } catch (error) {
    console.error('Failed to fetch ticket types data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ticket types data' },
      { status: 500 }
    );
  }
}
