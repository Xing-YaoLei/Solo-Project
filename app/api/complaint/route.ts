import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import type { ApiResponse, ComplaintEvidence } from '@/types';
import { CLEANING_PUNCTUALITY_RULE } from '@/lib/utils';
import { generateComplaints, filterByDataScope, generateCleaningPunctuality } from '@/lib/mockData';

export async function GET(request: Request) {
  const auth = await getAuthContext();
  const { searchParams } = new URL(request.url);
  const severity = searchParams.get('severity') as 'low' | 'medium' | 'high' | undefined;
  const status = searchParams.get('status') as 'open' | 'processing' | 'resolved' | undefined;

  let records = generateComplaints(30);
  records = filterByDataScope(records, auth.dataScope);

  if (severity) {
    records = records.filter(r => r.severity === severity);
  }
  if (status) {
    records = records.filter(r => r.status === status);
  }

  const punctuality = generateCleaningPunctuality();

  const response: ApiResponse<ComplaintEvidence[]> = {
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
