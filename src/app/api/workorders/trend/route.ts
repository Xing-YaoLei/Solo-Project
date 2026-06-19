import { NextResponse } from 'next/server';
import { getMockWorkorderTrend } from '@/lib/mockData';

export async function GET() {
  const data = getMockWorkorderTrend();
  return NextResponse.json(data);
}
