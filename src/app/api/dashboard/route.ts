import { NextResponse } from 'next/server';
import { getMockDashboardData } from '@/lib/mockData';

export async function GET() {
  const data = getMockDashboardData();
  return NextResponse.json(data);
}
