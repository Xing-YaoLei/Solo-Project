import { NextResponse } from 'next/server';
import { generateMockLockRecords } from '@/lib/mockData';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('activityId');
    const anomalyOnly = searchParams.get('anomalyOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    let records = generateMockLockRecords();
    
    if (anomalyOnly) {
      records = records.filter(r => r.isAnomaly);
    }
    
    const startIndex = (page - 1) * pageSize;
    const paginatedRecords = records.slice(startIndex, startIndex + pageSize);
    
    return NextResponse.json({
      success: true,
      data: {
        records: paginatedRecords,
        total: records.length,
        page,
        pageSize,
        anomalyCount: records.filter(r => r.isAnomaly).length,
        activityId,
        lastRefreshedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to fetch lock records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lock records' },
      { status: 500 }
    );
  }
}
