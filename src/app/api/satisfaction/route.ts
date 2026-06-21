import { NextResponse } from 'next/server';
import { mockSatisfactions } from '@/data/mockData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minRating = searchParams.get('minRating');
  
  let data = mockSatisfactions;
  
  if (minRating) {
    data = data.filter((s) => s.rating >= parseInt(minRating, 10));
  }

  const avgRating = data.length > 0
    ? data.reduce((sum, s) => sum + s.rating, 0) / data.length
    : 0;

  const satisfactionRate = data.length > 0
    ? data.filter((s) => s.rating >= 4).length / data.length
    : 0;

  return NextResponse.json({
    data,
    total: data.length,
    avgRating,
    satisfactionRate,
  });
}
