import { NextResponse } from 'next/server';
import { getCompareData, getDataVersions } from '@/services/compareService';

export async function GET() {
  const compareData = getCompareData();
  const versions = getDataVersions();

  return NextResponse.json({
    ...compareData,
    versions,
  });
}
