import { NextResponse } from 'next/server';
import { getMockInspections } from '@/lib/mockData';

export async function GET() {
  const data = getMockInspections();
  return NextResponse.json(data);
}
