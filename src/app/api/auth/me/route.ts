import { NextResponse } from 'next/server';
import { MOCK_USER } from '@/lib/mockData';

export async function GET() {
  return NextResponse.json(MOCK_USER);
}
