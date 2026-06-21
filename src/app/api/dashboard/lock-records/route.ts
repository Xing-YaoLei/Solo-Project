import { NextResponse } from 'next/server';
import { getDashboardSnapshot } from '@/services/dashboardService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activityIdsParam = searchParams.get('activityIds');
    const activityIds = activityIdsParam ? activityIdsParam.split(',') : undefined;
    const anomalyOnly = searchParams.get('anomalyOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const snapshot = await getDashboardSnapshot(activityIds);
    const allRecords = snapshot.lockRecords;

    let filteredRecords = allRecords.records;
    let filteredTotal = allRecords.total;
    let filteredAnomalyCount = allRecords.anomalyCount;

    if (anomalyOnly) {
      filteredRecords = allRecords.records.filter(r => r.isAnomaly);
      filteredTotal = filteredRecords.length;
      filteredAnomalyCount = filteredRecords.length;
    }

    const startIdx = (page - 1) * pageSize;
    const paginatedRecords = filteredRecords.slice(startIdx, startIdx + pageSize);

    return NextResponse.json({
      success: true,
      data: {
        records: paginatedRecords,
        total: filteredTotal,
        page,
        pageSize,
        anomalyCount: filteredAnomalyCount,
        activityIds,
        lastRefreshedAt: snapshot.lastRefreshedAt,
        occupancyRateSpec: snapshot.occupancyRateSpec,
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
