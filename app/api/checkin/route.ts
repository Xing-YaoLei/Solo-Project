import { NextResponse } from 'next/server';
import type { ApiResponse, CheckinRecord, DataScope } from '@/types';
import { CLEANING_PUNCTUALITY_RULE } from '@/lib/utils';
import { getCheckinTrend, getCleaningPunctuality } from '@/lib/dbService';
import { validateShareToken, getAuthContext } from '@/lib/auth';

async function resolveScope(request: Request): Promise<{ dataScope: DataScope; error?: string }> {
  const shareToken = request.headers.get('X-Share-Token') || undefined;
  const sharePassword = request.headers.get('X-Share-Password') || undefined;
  if (shareToken) {
    const v = await validateShareToken(shareToken, sharePassword);
    if (!v.valid) return { dataScope: {} as DataScope, error: v.error || '分享链接无效' };
    if (v.authContext) return { dataScope: v.authContext.dataScope };
  }
  const auth = await getAuthContext();
  return { dataScope: auth.dataScope };
}

export async function GET(request: Request) {
  const { dataScope, error } = await resolveScope(request);
  if (error) {
    return NextResponse.json({ success: false, error: { code: 'SHARE_INVALID', message: error } } as unknown as ApiResponse<null>, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);
  const hotelId = searchParams.get('hotelId') || undefined;
  const idType = (searchParams.get('idType') as 'id_card' | 'passport' | 'other') || undefined;

  const records = await getCheckinTrend(dataScope, days, { hotelId, idType });
  const punctuality = await getCleaningPunctuality(dataScope);

  const response: ApiResponse<CheckinRecord[]> = {
    success: true,
    data: records,
    metadata: {
      lastRefreshedAt: new Date().toISOString(),
      dataScope,
      punctualityRate: punctuality.punctualityRate,
      calculationRule: CLEANING_PUNCTUALITY_RULE,
    },
  };

  return NextResponse.json(response);
}
