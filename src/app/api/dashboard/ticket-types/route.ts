import { NextResponse } from 'next/server';
import { generateMockTicketTypes } from '@/lib/mockData';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('activityId');
    
    const ticketTypes = generateMockTicketTypes();
    
    return NextResponse.json({
      success: true,
      data: {
        ticketTypes,
        activityId,
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
