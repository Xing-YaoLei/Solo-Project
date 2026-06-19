import { NextResponse } from 'next/server';
import type { ApiResponse, DepositRecord } from '@/types';
import { CLEANING_PUNCTUALITY_RULE } from '@/lib/utils';
import { getDepositRecords, getCleaningPunctuality } from '@/lib/dbService';
import { validateShareToken, getAuthContext } from '@/lib/auth';

async function resolveScope(request: Request) {
  const shareToken = request.headers.get('X-Share-Token') || undefined;
  const sharePassword = request.headers.get('X-Share-Password') || undefined;
  let auth = await getAuthContext();
  let dataScope = auth.dataScope;
  if (shareToken) {
    const v = await validateShareToken(shareToken, sharePassword);
    if (v.valid && v.authContext) {
      auth = v.authContext;
      dataScope = auth.dataScope;
    }
  }
  return { auth, dataScope };
}

export async function GET(request: Request) {
  const { dataScope } = await resolveScope(request);
  const { searchParams } = new URL(request.url);
  const status = (searchParams.get('status') as 'collected' | 'refunded' | 'deducted' | 'pending') || undefined;

  const { records, breakdown } = await getDepositRecords(dataScope, { status });
  const punctuality = await getCleaningPunctuality(dataScope);

  const response: ApiResponse<{ records: DepositRecord[]; breakdown: typeof breakdown }> = {
    success: true,
    data: { records, breakdown },
    metadata: {
      lastRefreshedAt: new Date().toISOString(),
      dataScope,
      punctualityRate: punctuality.punctualityRate,
      calculationRule: CLEANING_PUNCTUALITY_RULE,
    },
  };

  return NextResponse.json(response);
}
