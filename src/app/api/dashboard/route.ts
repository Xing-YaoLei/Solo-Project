import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/dataService';

export async function GET() {
  try {
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API dashboard] 错误:', error);
    return NextResponse.json(
      { error: '获取仪表盘数据失败' },
      { status: 500 }
    );
  }
}
