import { NextResponse } from 'next/server';
import { mockConflicts } from '@/data/mockData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  
  let data = mockConflicts;
  
  if (status) {
    data = data.filter((c) => c.status === status);
  }

  return NextResponse.json({
    data,
    total: data.length,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  return NextResponse.json({
    success: true,
    message: 'Conflict created successfully',
    data: body,
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  
  return NextResponse.json({
    success: true,
    message: 'Conflict updated successfully',
    data: body,
  });
}
