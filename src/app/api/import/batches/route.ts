import { NextResponse } from 'next/server';
import { getImportBatches } from '@/services/importService';
import { BatchType } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as BatchType | undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const data = await getImportBatches(type, page, pageSize);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: '获取批次列表失败' },
      { status: 500 }
    );
  }
}
