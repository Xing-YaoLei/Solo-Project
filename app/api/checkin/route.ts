import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import type { ApiResponse, CheckinRecord } from '@/types';
import { CLEANING_PUNCTUALITY_RULE } from '@/lib/utils';
import { generateCheckinTrend, filterByDataScope, generateCleaningPunctuality } from '@/lib/mockData';

export async function GET(request: Request) {
  const auth = await getAuthContext();
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);
  const hotelId = searchParams.get('hotelId');
  const idType = searchParams.get('idType') as 'id_card' | 'passport' | 'other' | undefined;

  let records = generateCheckinTrend(days);
  records = filterByDataScope(records, auth.dataScope);

  if (hotelId) {
    records = records.filter(r => r.hotelId === hotelId);
  }
  if (idType) {
    records = records.filter(r => r.idType === idType);
  }

  const punctuality = generateCleaningPunctuality();

  const response: ApiResponse<CheckinRecord[]> = {
    success: true,
    data: records,
    metadata: {
      lastRefreshedAt: new Date().toISOString(),
      dataScope: auth.dataScope,
      punctualityRate: punctuality.punctualityRate,
      calculationRule: CLEANING_PUNCTUALITY_RULE,
    },
  };

  return NextResponse.json(response);
}
