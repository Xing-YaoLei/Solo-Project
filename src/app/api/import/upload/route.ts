import { NextResponse } from 'next/server';
import { createBatch, processBatch } from '@/services/importService';
import { BatchType } from '@/types';
import { CONFIG } from '@/services/config';

async function resolveImporterId(
  providedId: string | null,
  email: string | null
): Promise<string> {
  if (!CONFIG.USE_MOCK) {
    const { prisma } = await import('@/lib/prisma');
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true },
      });
      if (user) {
        if (user.role !== 'MANAGER') {
          throw new Error('当前账号无数据导入权限，仅管理层可导入');
        }
        return user.id;
      }
    }
    if (providedId) {
      const user = await prisma.user.findUnique({
        where: { id: providedId },
        select: { id: true, role: true },
      });
      if (user) {
        if (user.role !== 'MANAGER') {
          throw new Error('当前账号无数据导入权限，仅管理层可导入');
        }
        return user.id;
      }
    }
    const anyManager = await prisma.user.findFirst({
      where: { role: 'MANAGER' },
      select: { id: true },
    });
    if (anyManager) return anyManager.id;
    throw new Error('数据库中不存在管理层用户，请先执行 npm run db:seed 初始化');
  }

  // Mock 模式：确保 ID 在技术上可用，权限由前端控制
  if (providedId) return providedId;
  return '1';
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as BatchType;
    const importedBy = formData.get('importedBy') as string | null;
    const importerEmail = formData.get('importerEmail') as string | null;

    if (!file || !type) {
      return NextResponse.json(
        { error: '缺少必要参数：file 或 type' },
        { status: 400 }
      );
    }
    if (!CONFIG.ALLOWED_IMPORT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `无效的导入类型：${type}，支持：${CONFIG.ALLOWED_IMPORT_TYPES.join('、')}` },
        { status: 400 }
      );
    }

    const resolvedImporterId = await resolveImporterId(importedBy, importerEmail);
    const batch = await createBatch(type, file.name, resolvedImporterId);

    const fileContent = await file.text();
    const processedBatch = await processBatch(batch.id, fileContent, type);

    return NextResponse.json(processedBatch);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '文件上传或批次处理失败' },
      { status: 500 }
    );
  }
}
