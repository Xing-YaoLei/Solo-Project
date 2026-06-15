import { NextResponse } from 'next/server';

function resolveDataSourceMode(): 'mock' | 'prisma' {
  const mode = process.env.NEXT_PUBLIC_DATA_SOURCE || process.env.DATA_SOURCE;
  if (mode === 'prisma' && !!process.env.DATABASE_URL) {
    return 'prisma';
  }
  return 'mock';
}

export async function GET() {
  const mode = resolveDataSourceMode();
  return NextResponse.json({ mode });
}
