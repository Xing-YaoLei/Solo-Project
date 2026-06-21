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
        totalSeats: snapshot.overview.totalSeats,
        soldSeats: snapshot.overview.soldSeats,
        occupancyRate: snapshot.overview.occupancyRate,
        lockedSeats: snapshot.overview.lockedSeats,
        anomalyCount: snapshot.overview.anomalyCount,
        lastRefreshedAt: snapshot.lastRefreshedAt,
        occupancyRateSpec: snapshot.occupancyRateSpec,
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
