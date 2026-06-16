import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initializeDefaultThresholds, getAllThresholdConfigs } from '@/services/thresholdService';

export async function GET() {
  try {
    const configs = await getAllThresholdConfigs();

    if (configs.length === 0) {
      await initializeDefaultThresholds();
      const initialized = await getAllThresholdConfigs();
      return NextResponse.json({
        success: true,
        data: initialized,
        message: '已初始化默认阈值配置',
      });
    }

    return NextResponse.json({
      success: true,
      data: configs,
    });
  } catch (error) {
    console.error('获取阈值配置失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取阈值配置失败',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { updates, updatedBy } = body;

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        {
          success: false,
          error: '参数格式错误',
        },
        { status: 400 }
      );
    }

    const results = [];
    for (const update of updates) {
      const result = await prisma.thresholdConfig.update({
        where: { configKey: update.configKey },
        data: {
          configValue: update.configValue,
          updatedBy,
        },
      });
      results.push(result);
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: '配置已更新',
    });
  } catch (error) {
    console.error('更新阈值配置失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '更新阈值配置失败',
      },
      { status: 500 }
    );
  }
}
