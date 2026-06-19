import { NextResponse } from 'next/server';
import { getAuthContext, validateShareToken } from '@/lib/auth';
import type { ApiResponse, DashboardSummary, DataScope } from '@/types';
import { CLEANING_PUNCTUALITY_RULE } from '@/lib/utils';
import { getDashboardSummary, getCleaningPunctuality } from '@/lib/dbService';

async function resolveAndValidateDataScope(request: Request): Promise<{ dataScope: DataScope; error?: string }> {
  const headers = new Headers(request.headers);
  const shareToken = headers.get('X-Share-Token') || undefined;
  const sharePassword = headers.get('X-Share-Password') || undefined;
  const { searchParams } = new URL(request.url);
  const roleParam = searchParams.get('role') as any;

  if (shareToken) {
    const validation = await validateShareToken(shareToken, sharePassword);
    if (!validation.valid) {
      return { dataScope: {} as DataScope, error: validation.error || '分享链接无效' };
    }
    if (validation.authContext) {
      return { dataScope: validation.authContext.dataScope };
    }
  }

  const baseAuth = await getAuthContext();
  let dataScope: DataScope = baseAuth.dataScope;

  if (roleParam) {
    dataScope = { ...baseAuth.dataScope, role: roleParam };
  }

  return { dataScope };
}

export async function GET(request: Request) {
  const { dataScope, error } = await resolveAndValidateDataScope(request);
  if (error) {
    return NextResponse.json({ success: false, error: { code: 'SHARE_INVALID', message: error } } as unknown as ApiResponse<null>, { status: 403 });
  }

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
