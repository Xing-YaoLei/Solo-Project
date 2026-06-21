import { NextResponse } from 'next/server';
import { getSeatTrendData, getAreaHeatmapData } from '@/services/dashboardService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activityIdsParam = searchParams.get('activityIds');
    const activityIds = activityIdsParam ? activityIdsParam.split(',') : undefined;
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam) : 30;

    const [trendData, heatmapData] = await Promise.all([
      getSeatTrendData(activityIds, days),
      getAreaHeatmapData(activityIds),
    ]);

    const lastRefreshedAt = trendData.length > 0 
      ? new Date(trendData[trendData.length - 1].timestamp)
      : new Date();

    return NextResponse.json({
      success: true,
      data: {
        trend: trendData,
        heatmap: heatmapData,
        activityIds,
        lastRefreshedAt: lastRefreshedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to fetch seat trend data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch seat trend data' },
      { status: 500 }
    );
  }
}
