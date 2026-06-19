import { NextResponse } from 'next/server';
import { getMockInventoryData } from '@/lib/mockData';

export async function GET() {
  const data = getMockInventoryData();
  return NextResponse.json(data);
}
