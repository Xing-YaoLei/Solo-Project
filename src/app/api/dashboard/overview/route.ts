import { NextResponse } from 'next/server';
import { getDashboardOverview, getOccupancyRateSpec } from '@/services/dashboardService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activityIdsParam = searchParams.get('activityIds');
    const activityIds = activityIdsParam ? activityIdsParam.split(',') : undefined;

    const overview = await getDashboardOverview(activityIds);
    const occupancyRateSpec = await getOccupancyRateSpec();

    return NextResponse.json({
      success: true,
      data: {
        ...overview,
        occupancyRateSpec,
      },
    });
  } catch (error) {
    console.error('Failed to fetch dashboard overview:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard overview' },
      { status: 500 }
    );
  }
}
