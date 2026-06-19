import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import type { ApiResponse, DepositRecord } from '@/types';
import { CLEANING_PUNCTUALITY_RULE } from '@/lib/utils';
import { generateDepositRecords, filterByDataScope, generateCleaningPunctuality } from '@/lib/mockData';

export async function GET(request: Request) {
  const auth = await getAuthContext();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as 'collected' | 'refunded' | 'deducted' | 'pending' | undefined;

  let records = generateDepositRecords(100);
  records = filterByDataScope(records, auth.dataScope);

  if (status) {
    records = records.filter(r => r.status === status);
  }

  const breakdown = {
    total: records.reduce((sum, d) => sum + d.totalAmount, 0),
    refunded: records.reduce((sum, d) => sum + d.refundedAmount, 0),
    deducted: records.reduce((sum, d) => sum + d.deductedAmount, 0),
    pending: records.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.totalAmount, 0),
  };

  const punctuality = generateCleaningPunctuality();

  const response: ApiResponse<{ records: DepositRecord[]; breakdown: typeof breakdown }> = {
    success: true,
    data: { records, breakdown },
    metadata: {
      lastRefreshedAt: new Date().toISOString(),
      dataScope: auth.dataScope,
      punctualityRate: punctuality.punctualityRate,
      calculationRule: CLEANING_PUNCTUALITY_RULE,
    },
  };

  return NextResponse.json(response);
}
