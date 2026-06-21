import { NextResponse } from 'next/server';
import { generateMockSeatTrend, generateMockAreaHeatmap } from '@/lib/mockData';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('activityId');
    
    const trendData = generateMockSeatTrend();
    const heatmapData = generateMockAreaHeatmap();
    
    return NextResponse.json({
      success: true,
      data: {
        trend: trendData,
        heatmap: heatmapData,
        activityId,
        lastRefreshedAt: new Date().toISOString(),
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
