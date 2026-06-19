import { NextResponse } from 'next/server';
import { getInspections } from '@/lib/dataService';

export async function GET() {
  try {
    const data = await getInspections();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API inspections] 错误:', error);
    return NextResponse.json(
      { error: '获取质检数据失败' },
      { status: 500 }
    );
  }
}
