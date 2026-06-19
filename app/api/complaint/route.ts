import { NextResponse } from 'next/server';
import type { ApiResponse, ComplaintEvidence, DataScope } from '@/types';
import { CLEANING_PUNCTUALITY_RULE } from '@/lib/utils';
import { getComplaints, getCleaningPunctuality } from '@/lib/dbService';
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
  const severity = (searchParams.get('severity') as 'low' | 'medium' | 'high') || undefined;
  const status = (searchParams.get('status') as 'open' | 'processing' | 'resolved') || undefined;

  const records = await getComplaints(dataScope, { severity, status });
  const punctuality = await getCleaningPunctuality(dataScope);

  const response: ApiResponse<ComplaintEvidence[]> = {
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
