import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import type { ApiResponse, DashboardSummary } from '@/types';
import { CLEANING_PUNCTUALITY_RULE } from '@/lib/utils';
import { generateDashboardSummary, filterByDataScope } from '@/lib/mockData';

export async function GET(request: Request) {
  const auth = await getAuthContext();
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);

  let summary = generateDashboardSummary(auth.dataScope.role);

  summary = {
    ...summary,
    checkinTrend: filterByDataScope(summary.checkinTrend, auth.dataScope),
    recentComplaints: filterByDataScope(summary.recentComplaints, auth.dataScope),
  };

  const response: ApiResponse<DashboardSummary> = {
    success: true,
    data: summary,
    metadata: {
      lastRefreshedAt: new Date().toISOString(),
      dataScope: auth.dataScope,
      punctualityRate: summary.punctuality.punctualityRate,
      calculationRule: CLEANING_PUNCTUALITY_RULE,
    },
  };

  return NextResponse.json(response);
}
