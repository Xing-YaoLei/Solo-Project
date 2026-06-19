import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/dataService';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json(user);
  } catch (error) {
    console.error('[API auth/me] 错误:', error);
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    );
  }
}
