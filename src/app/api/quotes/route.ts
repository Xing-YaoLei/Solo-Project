import { NextResponse } from 'next/server';
import { getQuotes } from '@/lib/dataService';

export async function GET() {
  try {
    const data = await getQuotes();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API quotes] 错误:', error);
    return NextResponse.json(
      { error: '获取报价单数据失败' },
      { status: 500 }
    );
  }
}
