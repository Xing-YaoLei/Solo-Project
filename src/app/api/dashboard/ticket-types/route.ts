import { NextResponse } from 'next/server';
import { getTicketTypes } from '@/services/dashboardService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activityIdsParam = searchParams.get('activityIds');
    const activityIds = activityIdsParam ? activityIdsParam.split(',') : undefined;

    const ticketTypes = await getTicketTypes(activityIds);

    return NextResponse.json({
      success: true,
      data: {
        ticketTypes,
        activityIds,
        lastRefreshedAt: new Date().toISOString(),
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
