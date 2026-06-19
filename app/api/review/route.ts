import { NextResponse } from 'next/server';
import type { ApiResponse, ReviewTag } from '@/types';
import { CLEANING_PUNCTUALITY_RULE } from '@/lib/utils';
import { getReviewTags, getCleaningPunctuality } from '@/lib/dbService';
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
  const sentiment = (searchParams.get('sentiment') as 'positive' | 'neutral' | 'negative') || undefined;
  const anomalyOnly = searchParams.get('anomalyOnly') === 'true';

  const tags = await getReviewTags(dataScope, { sentiment, anomalyOnly });
  const punctuality = await getCleaningPunctuality(dataScope);

  const response: ApiResponse<ReviewTag[]> = {
    success: true,
    data: tags,
    metadata: {
      lastRefreshedAt: new Date().toISOString(),
      dataScope,
      punctualityRate: punctuality.punctualityRate,
      calculationRule: CLEANING_PUNCTUALITY_RULE,
    },
  };

  return NextResponse.json(response);
}
