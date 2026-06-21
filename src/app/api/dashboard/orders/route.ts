import { NextResponse } from 'next/server';
import { generateMockOrderComposition } from '@/lib/mockData';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('activityId');
    
    const orderData = generateMockOrderComposition();
    
    return NextResponse.json({
      success: true,
      data: {
        ...orderData,
        activityId,
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
