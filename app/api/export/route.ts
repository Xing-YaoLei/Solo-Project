import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import type { ApiResponse } from '@/types';
import { CLEANING_PUNCTUALITY_RULE } from '@/lib/utils';
import {
  generateCheckinTrend,
  generateDepositRecords,
  generateComplaints,
  generateReviewTags,
  generateCleaningPunctuality,
  filterByDataScope,
} from '@/lib/mockData';

export async function POST(request: Request) {
  const auth = await getAuthContext();
  const body = await request.json();
  const { type, format } = body;

  const punctuality = generateCleaningPunctuality();

  let exportData: any;
  let fileName = '';

  switch (type) {
    case 'checkin':
      exportData = filterByDataScope(generateCheckinTrend(30), auth.dataScope);
      fileName = `入住证件趋势_${new Date().toISOString().split('T')[0]}`;
      break;
    case 'deposit':
      exportData = filterByDataScope(generateDepositRecords(100), auth.dataScope);
      fileName = `押金明细_${new Date().toISOString().split('T')[0]}`;
      break;
    case 'complaint':
      exportData = filterByDataScope(generateComplaints(30), auth.dataScope);
      fileName = `客诉证据_${new Date().toISOString().split('T')[0]}`;
      break;
    case 'review':
      exportData = generateReviewTags();
      fileName = `点评标签_${new Date().toISOString().split('T')[0]}`;
      break;
    case 'dashboard':
      exportData = {
        punctuality,
        checkinTrend: filterByDataScope(generateCheckinTrend(30), auth.dataScope),
        deposits: filterByDataScope(generateDepositRecords(50), auth.dataScope),
        complaints: filterByDataScope(generateComplaints(15), auth.dataScope),
        reviewTags: generateReviewTags(),
        punctualityRule: CLEANING_PUNCTUALITY_RULE,
      };
      fileName = `监测仪表盘_${new Date().toISOString().split('T')[0]}`;
      break;
    default:
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_TYPE', message: '无效的导出类型' },
      } as ApiResponse<null>, { status: 400 });
  }

  const response: ApiResponse<{
    data: typeof exportData;
    fileName: string;
    format: string;
    punctualityRate: number;
    calculationRule: string;
  }> = {
    success: true,
    data: {
      data: exportData,
      fileName,
      format,
      punctualityRate: punctuality.punctualityRate,
      calculationRule: CLEANING_PUNCTUALITY_RULE,
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
