import { NextResponse } from 'next/server';
import { createBatch, processBatch } from '@/services/importService';
import { BatchType } from '@/types';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as BatchType;

    if (!file || !type) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const batch = await createBatch(type, file.name, '1');

    const fileContent = await file.text();
    const processedBatch = await processBatch(batch.id, fileContent, type);

    return NextResponse.json(processedBatch);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '文件上传失败' },
      { status: 500 }
    );
  }
}
