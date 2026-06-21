import { NextResponse } from 'next/server';
import { getOrderComposition } from '@/services/dashboardService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activityIdsParam = searchParams.get('activityIds');
    const activityIds = activityIdsParam ? activityIdsParam.split(',') : undefined;

    const orderData = await getOrderComposition(activityIds);

    return NextResponse.json({
      success: true,
      data: {
        ...orderData,
        activityIds,
        lastRefreshedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to fetch order composition data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order composition data' },
      { status: 500 }
    );
  }
}
