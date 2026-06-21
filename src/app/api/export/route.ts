import { NextResponse } from 'next/server';
import { mockHearings } from '@/data/mockData';

export async function POST(request: Request) {
  const { format, filters, title } = await request.json();
  
  return NextResponse.json({
    success: true,
    format,
    title,
    filters,
    downloadUrl: `/api/download/${Date.now()}`,
  });
}
