import { NextResponse } from 'next/server';
import { generateMockOverview } from '@/lib/mockData';
import { getOccupancyRateSpec } from '@/lib/utils';

export async function GET() {
  try {
    const overview = generateMockOverview();
    
    return NextResponse.json({
      success: true,
      data: {
        ...overview,
        lastRefreshedAt: new Date().toISOString(),
        occupancyRateSpec: getOccupancyRateSpec(),
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
