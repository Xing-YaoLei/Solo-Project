import { NextResponse } from 'next/server';
import { getMockQuotes } from '@/lib/mockData';

export async function GET() {
  const data = getMockQuotes();
  return NextResponse.json(data);
}
