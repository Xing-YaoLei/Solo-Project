import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import type { ApiResponse } from '@/types';
import { CLEANING_PUNCTUALITY_RULE } from '@/lib/utils';
import { generateCleaningPunctuality } from '@/lib/mockData';

export async function GET() {
  const auth = await getAuthContext();
  const punctuality = generateCleaningPunctuality();

  const response: ApiResponse<{ auth: typeof auth }> = {
    success: true,
    data: { auth },
    metadata: {
      lastRefreshedAt: new Date().toISOString(),
      dataScope: auth.dataScope,
      punctualityRate: punctuality.punctualityRate,
      calculationRule: CLEANING_PUNCTUALITY_RULE,
    },
  };

  return NextResponse.json(response);
}
