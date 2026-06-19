import { NextResponse } from 'next/server';
import { getAuthContext, validateShareToken } from '@/lib/auth';
import type { ApiResponse, DashboardSummary, DataScope } from '@/types';
import { CLEANING_PUNCTUALITY_RULE } from '@/lib/utils';
import { getDashboardSummary, getCleaningPunctuality } from '@/lib/dbService';

async function resolveDataScope(request: Request) {
  const headers = new Headers(request.headers);
  const shareToken = headers.get('X-Share-Token') || undefined;
  const sharePassword = headers.get('X-Share-Password') || undefined;
  const { searchParams } = new URL(request.url);
  const roleParam = searchParams.get('role') as any;

  let baseAuth = await getAuthContext();
  let dataScope: DataScope = baseAuth.dataScope;

  if (shareToken) {
    const validation = await validateShareToken(shareToken, sharePassword);
    if (validation.valid && validation.authContext) {
      baseAuth = validation.authContext;
      dataScope = baseAuth.dataScope;
    }
  } else if (roleParam) {
    dataScope = { ...baseAuth.dataScope, role: roleParam };
  }

  return { auth: baseAuth, dataScope };
}

export async function GET(request: Request) {
  const { dataScope } = await resolveDataScope(request);

  const summary = await getDashboardSummary(dataScope);
  const punctuality = await getCleaningPunctuality(dataScope);

  const response: ApiResponse<DashboardSummary> = {
    success: true,
    data: summary,
    metadata: {
      lastRefreshedAt: new Date().toISOString(),
      dataScope,
      punctualityRate: punctuality.punctualityRate,
      calculationRule: CLEANING_PUNCTUALITY_RULE,
    },
  };

  return NextResponse.json(response);
}
