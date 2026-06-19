import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import type { ApiResponse, ReviewTag } from '@/types';
import { CLEANING_PUNCTUALITY_RULE } from '@/lib/utils';
import { generateReviewTags, generateCleaningPunctuality } from '@/lib/mockData';

export async function GET(request: Request) {
  const auth = await getAuthContext();
  const { searchParams } = new URL(request.url);
  const sentiment = searchParams.get('sentiment') as 'positive' | 'neutral' | 'negative' | undefined;
  const anomalyOnly = searchParams.get('anomalyOnly') === 'true';

  let tags = generateReviewTags();

  if (sentiment) {
    tags = tags.filter(t => t.sentiment === sentiment);
  }
  if (anomalyOnly) {
    tags = tags.filter(t => t.isAnomaly);
  }

  const punctuality = generateCleaningPunctuality();

  const response: ApiResponse<ReviewTag[]> = {
    success: true,
    data: tags,
    metadata: {
      lastRefreshedAt: new Date().toISOString(),
      dataScope: auth.dataScope,
      punctualityRate: punctuality.punctualityRate,
      calculationRule: CLEANING_PUNCTUALITY_RULE,
    },
  };

  return NextResponse.json(response);
}
