import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import type { ApiResponse } from '@/types';
import { CLEANING_PUNCTUALITY_RULE } from '@/lib/utils';
import { generateCleaningPunctuality } from '@/lib/mockData';

export async function POST() {
  const auth = await getAuthContext();
  const punctuality = generateCleaningPunctuality();

  await new Promise(resolve => setTimeout(resolve, 1500));

  const response: ApiResponse<{
    refreshedAt: string;
    status: 'success';
    message: string;
  }> = {
    success: true,
    data: {
      refreshedAt: new Date().toISOString(),
      status: 'success',
      message: '数据刷新成功，已同步最新门锁记录、OTA订单和客服消息',
    },
    metadata: {
      lastRefreshedAt: new Date().toISOString(),
      dataScope: auth.dataScope,
      punctualityRate: punctuality.punctualityRate,
      calculationRule: CLEANING_PUNCTUALITY_RULE,
    },
  };

  return NextResponse.json(response);
}
