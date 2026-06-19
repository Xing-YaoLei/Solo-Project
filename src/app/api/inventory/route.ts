import { NextResponse } from 'next/server';
import { getInventoryData } from '@/lib/dataService';

export async function GET() {
  try {
    const data = await getInventoryData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API inventory] 错误:', error);
    return NextResponse.json(
      { error: '获取库存数据失败' },
      { status: 500 }
    );
  }
}
